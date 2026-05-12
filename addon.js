const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
    id: "com.justin.ppv.sports",
    version: "1.0.0",
    name: "Justin PPV Sports",
    description: "PPV.to sports catalog",
    resources: ["catalog", "stream", "meta"],
    types: ["movie"],
    catalogs: [
        {
            type: "movie",
            id: "ppv-live",
            name: "PPV Live Sports"
        }
    ]
};

const builder = new addonBuilder(manifest);

async function getPPVStreams() {
    const response = await fetch("https://api.ppv.to/api/streams");
    const data = await response.json();

    if (!data || !data.success || !Array.isArray(data.streams)) {
        return [];
    }

    const allStreams = [];

    for (const category of data.streams) {
        if (!category.streams) continue;

        for (const stream of category.streams) {
            allStreams.push({
                ...stream,
                category: category.category
            });
        }
    }

    return allStreams;
}

function makeId(stream) {
    return "ppv_" + stream.id;
}

builder.defineCatalogHandler(async () => {
    const streams = await getPPVStreams();

    const metas = streams.map(stream => ({
        id: makeId(stream),
        type: "movie",
        name: stream.name,
        poster: stream.poster || "https://via.placeholder.com/500x281.png?text=PPV+Sports",
        background: stream.poster || "https://via.placeholder.com/500x281.png?text=PPV+Sports",
        description: `${stream.category_name || stream.category || "Sports"}${stream.tag ? " | " + stream.tag : ""}`
    }));

    return { metas };
});

builder.defineMetaHandler(async ({ id }) => {
    const streams = await getPPVStreams();
    const realId = id.replace("ppv_", "");

    const stream = streams.find(s => String(s.id) === realId);

    if (!stream) {
        return { meta: null };
    }

    return {
        meta: {
            id: makeId(stream),
            type: "movie",
            name: stream.name,
            poster: stream.poster || "https://via.placeholder.com/500x281.png?text=PPV+Sports",
            background: stream.poster || "https://via.placeholder.com/500x281.png?text=PPV+Sports",
            description: `${stream.category_name || stream.category || "Sports"}${stream.tag ? " | " + stream.tag : ""}`
        }
    };
});

builder.defineStreamHandler(async ({ id }) => {
    const streams = await getPPVStreams();
    const realId = id.replace("ppv_", "");

    const stream = streams.find(s => String(s.id) === realId);

    if (!stream) {
        return { streams: [] };
    }

    return {
        streams: [
            {
                title: stream.tag || stream.category_name || "PPV.to",
                externalUrl: `https://ppv.to/live/${stream.uri_name}`
            }
        ]
    };
});

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });

console.log("PPV addon running on port " + port);