const moment = require('moment');
const axios = require('axios');

const API_URL = 'https://tsserv.tinkermode.dev/data';

const beginTimestamp = process.argv[2];
const endTimestamp = process.argv[3];

const beginHour = moment(beginTimestamp).startOf('hour');
const endHour = moment(endTimestamp).startOf('hour');

async function fetchTimeSeries(begin, end) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                begin: begin.toISOString(),
                end: end.toISOString()
            }
        });

        return response.data
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const [timestamp, value] = line.trim().split(' ');
                return { timestamp, value: parseFloat(value) };
            });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

async function processData() {
    const buckets = {};
    let currentHour = moment(beginHour);

    while (currentHour.isSameOrBefore(endHour)) {
        const begin = currentHour.toISOString();
        const end = currentHour.clone().add(1, 'hour').subtract(1, 'second').toISOString();

        const data = await fetchTimeSeries(moment(begin), moment(end));
        const sum = data.reduce((acc, { value }) => {
            if (!isNaN(value)) {
                return acc + value;
            } else {
                return acc;
            }
        }, 0);
        const count = data.length;
        const average = sum / count;

        buckets[begin] = average;
        currentHour = currentHour.add(1, 'hour');
    }

    Object.entries(buckets).forEach(([timestamp, value]) => {
        console.log(`${timestamp} ${value.toFixed(4)}`);
    });
}

processData();