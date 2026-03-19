const axios = require("axios");
const { google } = require("googleapis");
const fs = require("fs");
const moment = require("moment");
require("moment-duration-format");

const configFile = fs.existsSync("adminConfig.json")
    ? "adminConfig.json"
    : "config.json";

const config = require(`./${configFile}`);
//
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

const client = auth.getClient();

const googleSheets = google.sheets({ version: "v4", auth: client });

const spreadsheetId = config.SpreadsheetId;

var currentDate = ""

async function getCurrentDate() {

    return moment().format("DD.MM.YYYY")

}

async function updateDate() {

    currentDate = await getCurrentDate()

}

async function placeData(Data) {
    const groupName = Data.name;
    const groupMemberCount = Data.memberCount;

    try {

        await updateDate();

        await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: "A2:C40",
            valueInputOption: "USER_ENTERED",
            resource: {
                values: [[currentDate, groupName, groupMemberCount]],
            },
        });

    }
    catch (err) {
        console.log("Error: ", err.message);
    }

}

async function setDate() {

    const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "A:C",
    });

    currentDate = getRows.data.values[getRows.data.values.length - 1][0]

}

async function fetchGroup() {

    if (currentDate == "")
        await setDate();

    let getDate = await getCurrentDate();

    if (getDate != currentDate) {

        console.log("Updating the sheets.")

        axios.get(`https://groups.roblox.com/v1/groups/${config.GroupId}/`)
            .then((response) => {
                placeData(response.data);
            })
            .catch((err) => {
                console.log("Error: ", err.message);

                setTimeout(fetchGroup, 60 * 1000); // retry after 1 minute if there's an error
            });

    }


}

fetchGroup();

console.log("Fetched for first time.")

setInterval(() => {

    console.log("Fetching again.")
    fetchGroup();

}, 60 * 1000);