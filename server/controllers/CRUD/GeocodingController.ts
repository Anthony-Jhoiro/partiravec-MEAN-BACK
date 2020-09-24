/*
 *
 *
 * Copyright 2020 ANTHONY QUÉRÉ
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

import {GOOGLE_MAPS_API_KEY} from "../../tools/environment"
import * as request from "request";
import {CustomRequest} from "../../tools/types";
import {Response} from "express";
import {requireInQuery} from "../../tools/decorators";
import { SERVER_ERROR } from "../../tools/ErrorTypes";

class GeocodingController {


    @requireInQuery('address')
    getLocationFromAddress(req: CustomRequest, res: Response) {

        if (!(typeof req.query.address === 'string')) return res.status(400);
        request("https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURI(req.query.address) + "&key=" + GOOGLE_MAPS_API_KEY,
            (error, response, body) => {
                const parsedBody = JSON.parse(body);
                if (error) return res.status(500).send(SERVER_ERROR)
                if (parsedBody.results.length === 0) return res.json({error: "no location found"});;

                let country;
                // Get country
                for (let component of parsedBody.results[0].address_components) {
                    if (component.types.indexOf("country") !== -1) {
                        country = component.short_name;
                        break;
                    }
                }

                if (!country) return res.json({error: "no location found"});

                return res.json({
                    label: req.query.address,
                    lat: parsedBody.results[0].geometry.location.lat,
                    lng: parsedBody.results[0].geometry.location.lng,
                    country: country
                });
            });
    }
}


export const geocodingController = new GeocodingController();

