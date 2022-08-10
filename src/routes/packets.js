import * as html from '../renderer/html-renderer.js'
import * as sqlite from '../clients/sqlite.js'
import * as google from '../clients/google-client.js'
import * as queries from '../queries.js'
import * as utils from '../utils.js'
import * as responses from '../responses.js'

import { buildPacket } from '../directions-api.js'

export async function get (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  if (!name) {
    const names = sqlite.getAllPacketNames()
    const links = html.packetLinkList(names)
    responses.serveAsString(req, res, links)
  } else if (requestUrl.searchParams.has('queryOnly')) {
    const { query } = sqlite.getPacket(name)
    return responses.serveAsString(req, res, query)
  } else {
    const packetHtml = sqlite.getPacket(name)?.html_content
    return responses.serveHtml(req, res, packetHtml)
  }
}

export async function post (req, res) {
  const body = await utils.streamToString(req)

  try {
    generatePacket(body)
    responses.redirect(req, res, '/')
  } catch (err) {
    // TODO: Add more granular errors
    // i.e. A query parse failure is a bad request, google maps is bad gateway, etc
    console.error(err)
    responses.serveServerError(req, res)
  }
}

export async function del (req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`)
  const name = decodeURI(requestUrl.pathname).split('/').at(3)

  if (sqlite.deletePacket(name)) {
    return responses.serveNoContent(req, res)
  } else {
    return responses.serveBadRequest(req, res)
  }
}

export async function generatePacket (body) {
  console.log(body)
  const params = queries.parseQuery(body)
  const { name, date, stopNames, tripsOnboard } = params
  console.log(`Getting stop information for: ${stopNames}`)
  const stops = stopNames.map(sqlite.getStop)
  const trips = tripsOnboard.map(trip => (
    { ...trip, num_students: sqlite.getTrip(trip.name)?.num_students }
  ))
  const edgeListOfStops = queries.makeEdgeList(stops)

  // Create a list of promises that will resolve the directions between each pair of stops
  const directionsPromises = edgeListOfStops.map(([start, end]) => {
    const directions = sqlite.getDirections(start.coordinates, end.coordinates)

    if (directions) {
      console.log(`Cache hit for directions from ${start.name} to ${end.name}`)
      return Promise.resolve(directions)
    }

    console.log(`Cache miss for directions from ${start.name} to ${end.name}`)
    return google.getDirections(start.coordinates, end.coordinates)
  })
  const directionsList = await Promise.all(directionsPromises)

  const title = name || `From ${stopNames.at(0)} to ${stopNames.at(-1)} (${stopNames.length - 2} stops)`
  const packet = buildPacket(stops, directionsList, title, date, trips)
  sqlite.savePacket(title, body, packet.toString())
  sqlite.savePacketTrips(title, trips)
}
