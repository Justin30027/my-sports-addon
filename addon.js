const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const BASE = "https://streamed.pk";

const manifest = {
    id: "com.justin.streamed.sports",
    version: "1.0.0",
    name: "Justin Sports",
    description: "Live sports from Streamed.pk",
    resources: ["catalog", "meta", "stream"],
    types: ["movie"],
    catalogs: [
        {
            type: "movie",
            id: "streamed-live",
            name: "Live Sports"
        }
    ]
};

const builder = new addonBuilder(manifest);

async function getMatches() {
    const response = await fetch(`${BASE}/api/matches/live`);
    return await response.json();
}

function getPoster(match) {
    if (match.poster) {
        if (match.poster.startsWith("http")) return match.poster;
        if (match.poster.startsWith("/")) return `${BASE}${match.poster}.webp`;
        return `${BASE}/api/images/proxy/${match.poster}.webp`;
    }

    if (match.teams?.home?.badge && match.teams?.away?.badge) {
        return `${BASE}/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
    }

    return "https://via.placeholder.com/500x281.png?text=Live+Sports";
}

function makeId(match) {
    return "streamed_" + match.id;
}

function cleanId(id) {
    return id.replace("streamed_", "");
}

function isPlayable(url) {
    if (!url) return false;

    return (
        url.includes(".m3u8") ||
        url.includes(".mpd") ||
        url.includes(".mp4") ||
        url.includes("m3u8") ||
        url.includes("mpd")
    );
}

function getPlayableUrl(stream) {
    return (
        stream.url ||
        stream.file ||
        stream.link ||
        stream.hls ||
        stream.hlsUrl ||
        stream.m3u8 ||
        stream.m3u8Url ||
        stream.streamUrl ||
        stream.playbackUrl ||
        stream.embedUrl
    );
}

builder.defineCatalogHandler(async () => {
    const matches = await getMatches();

    const metas = matches.map(match => ({
        id: makeId(match),
        type: "movie",
        name: match.title,
        poster: getPoster(match),
        background: getPoster(match),
        description: `${match.category || "Sports"} | ${new Date(match.date).toLocaleString()}`
    }));

    return { metas };
});

builder.defineMetaHandler(async ({ id }) => {
    const matches = await getMatches();
    const realId = cleanId(id);

    const match = matches.find(m => String(m.id) === realId);

    if (!match) {
        return { meta: null };
    }

    return {
        meta: {
            id: makeId(match),
            type: "movie",
            name: match.title,
            poster: getPoster(match),
            background: getPoster(match),
            description: `${match.category || "Sports"} | ${new Date(match.date).toLocaleString()}`
        }
    };
});

builder.defineStreamHandler(async ({ id }) => {
    const matches = await getMatches();
    const realId = cleanId(id);

    const match = matches.find(m => String(m.id) === realId);

    if (!match || !match.sources || match.sources.length === 0) {
        return { streams: [] };
    }

    let stremioStreams = [];

    for (const source of match.sources) {
        try {
            const response = await fetch(`${BASE}/api/stream/${source.source}/${source.id}`);
            const streams = await response.json();

            console.log("Source:", source.source, source.id);
            console.log("Returned streams:", JSON.stringify(streams, null, 2));

            for (const stream of streams) {
                const playableUrl = getPlayableUrl(stream);

                console.log("Playable URL:", playableUrl);

                if (isPlayable(playableUrl)) {
                    stremioStreams.push({
                        title: `${stream.source || source.source} | Stream ${stream.streamNo || ""} | ${stream.language || "Unknown"} | ${stream.hd ? "HD" : "SD"}`,
                        url: playableUrl
                    });
                }
            }
        } catch (err) {
            console.log("Stream source failed:", source.source, err.message);
        }
    }

    return { streams: stremioStreams };
});

const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port });

console.log("Justin Sports Streamed addon running on port " + port);