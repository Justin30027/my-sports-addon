const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
    id: "com.justin.sports",
    version: "1.0.0",
    name: "Justin Sports",
    description: "My first sports addon",
    resources: ["catalog", "stream"],
    types: ["tv"],
    catalogs: [
        {
            type: "tv",
            id: "live-sports",
            name: "Live Sports"
        }
    ],
    idPrefixes: ["wf_"]
};

const builder = new addonBuilder(manifest);

async function getMatches() {
    const response = await fetch("https://api.watchfooty.st/api/v1/matches/live");
    return await response.json();
}

builder.defineCatalogHandler(async function(args) {
    const matches = await getMatches();

    const metas = matches.map(match => ({
        id: "wf_" + match.matchId,
        type: "tv",
        name: match.title,
        poster: match.poster,
        description: match.league || "Live sports match"
    }));

    return { metas };
});

builder.defineStreamHandler(async function(args) {
    const realId = args.id.replace("wf_", "");
    const matches = await getMatches();

    const match = matches.find(m => m.matchId === realId);

    if (!match || !match.streams) {
        return { streams: [] };
    }

    const streams = match.streams.map(stream => ({
        title: `${match.title} | ${stream.quality} | ${stream.language}`,
        url: stream.url
    }));

    return { streams };
});

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });

console.log("Addon running on port " + port);