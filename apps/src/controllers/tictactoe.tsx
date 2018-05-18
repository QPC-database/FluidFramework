import { api } from "@prague/routerlicious";
// import * as jwt from "jsonwebtoken";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { TicTacToe } from "./components/tictactoe/Game";

import prague = api;
import types = prague.types;
import Map = api.map;

async function loadDocument(id: string, token?: string): Promise<prague.api.Document> {
    console.log("Loading in root document...");
    const document = await prague.api.load(id, { encrypted: false, token }).catch((err) => {
        return Promise.reject(err);
    });

    console.log("Document loaded");
    return document;
}

function displayError(parentElement: JQuery, error: string) {
    const idElement = $(`<h2>${error}</h2>`);
    parentElement.append(idElement);
}

export async function load(id: string, tenantId: string, endPoints: any, token?: string) {
    /**
     * Id: elastic-dijkstra
     *
     * Key: 9f29be02664c7e3fa1f470faa05104ca
     */
    // const token = jwt.sign({
    //     id,
    //     permission: "read:write",
    //     "elastic-dijkstra",
    //     user: {
    //         id: test
    //     },
    // },
    // secret);

    $("document").ready(() => {
        prague.socketStorage.registerAsDefault(endPoints.delta, endPoints.storage, tenantId);
        loadDocument(id, token).then(async (doc) => {
            // tslint:disable-next-line
            window["doc"] = doc;
            const playerName = doc.getUser().id;
            let playerId: number;

            const rootView = await doc.getRoot().getView();
            let gameMap: types.IMap;
            let gameView: types.IMapView;
            if (rootView.has("game")) {
                playerId = 2;
                gameMap = rootView.get("game") as types.IMap;
                gameView = await gameMap.getView();
                gameView.set("pl2", playerName);
            } else {
                playerId = 1;
                rootView.set("game", doc.createMap());
                gameMap = rootView.get("game") as types.IMap;
                gameView = await gameMap.getView();
                gameView.set("pl1", playerName);
            }

            let canJoin: boolean = true;

            if (gameView.has("counter")) {
                const counter = gameView.get("counter") as api.map.Counter;
                if (counter.value === 2) {
                    canJoin = false;
                } else {
                    counter.increment(1);
                }
            } else {
                const counter = gameView.set<Map.Counter>("counter", undefined, Map.CounterValueType.Name);
                counter.increment(1);
                gameView.set("next", playerId);
            }

            if (!canJoin) {
                console.log(`${playerId} can't join the game!`);
                displayError($("#tictactoeViews"), "No more players allowed");
            } else {
                console.log(`${playerId} can join the game!`);
                const player = {
                    id: playerId,
                    name: doc.getUser().id,
                };
                ReactDOM.render(
                    <TicTacToe player={player} gameMap={gameMap} gameView={gameView}/>,
                    document.getElementById("tictactoeViews"),
                );
            }

        }, (err) => {
            displayError($("#tictactoeViews"), JSON.stringify(err));
            console.log(err);
        });
    });
}
