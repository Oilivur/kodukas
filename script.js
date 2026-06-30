const DATA_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=950&dates=20260611-20260719";
const TALLINN_TIME_ZONE = "Europe/Tallinn";
const AUTO_REFRESH_MS = 2 * 60 * 1000;

const TEAM_FLAGS = {
    "Algeria": "dz",
    "Angola": "ao",
    "Argentina": "ar",
    "Australia": "au",
    "Austria": "at",
    "Belgium": "be",
    "Bolivia": "bo",
    "Bosnia & Herzegovina": "ba",
    "Bosnia and Herzegovina": "ba",
    "Brazil": "br",
    "Burkina Faso": "bf",
    "Cameroon": "cm",
    "Canada": "ca",
    "Cape Verde": "cv",
    "Chile": "cl",
    "China": "cn",
    "Colombia": "co",
    "Costa Rica": "cr",
    "Croatia": "hr",
    "Curaçao": "cw",
    "Curacao": "cw",
    "Czech Republic": "cz",
    "Czechia": "cz",
    "Democratic Republic of the Congo": "cd",
    "DR Congo": "cd",
    "Congo DR": "cd",
    "CD Congo": "cd",
    "Congo-Kinshasa": "cd",
    "Denmark": "dk",
    "Ecuador": "ec",
    "Egypt": "eg",
    "England": "gb-eng",
    "France": "fr",
    "Germany": "de",
    "Ghana": "gh",
    "Greece": "gr",
    "Haiti": "ht",
    "Honduras": "hn",
    "Hungary": "hu",
    "Iran": "ir",
    "Iraq": "iq",
    "Ireland": "ie",
    "Italy": "it",
    "Ivory Coast": "ci",
    "Côte d'Ivoire": "ci",
    "Jamaica": "jm",
    "Japan": "jp",
    "Jordan": "jo",
    "Korea Republic": "kr",
    "Republic of Korea": "kr",
    "South Korea": "kr",
    "Mali": "ml",
    "Mexico": "mx",
    "Morocco": "ma",
    "Netherlands": "nl",
    "New Zealand": "nz",
    "Nigeria": "ng",
    "North Macedonia": "mk",
    "Norway": "no",
    "Panama": "pa",
    "Paraguay": "py",
    "Peru": "pe",
    "Poland": "pl",
    "Portugal": "pt",
    "Qatar": "qa",
    "Romania": "ro",
    "Saudi Arabia": "sa",
    "Scotland": "gb-sct",
    "Senegal": "sn",
    "Serbia": "rs",
    "Slovakia": "sk",
    "Slovenia": "si",
    "South Africa": "za",
    "Spain": "es",
    "Sweden": "se",
    "Switzerland": "ch",
    "Tunisia": "tn",
    "Turkey": "tr",
    "Türkiye": "tr",
    "Ukraine": "ua",
    "United Arab Emirates": "ae",
    "United States": "us",
    "USA": "us",
    "Uruguay": "uy",
    "Uzbekistan": "uz",
    "Venezuela": "ve",
    "Wales": "gb-wls"
};

const TEAM_CODES = {
    "Algeria": "ALG",
    "Angola": "ANG",
    "Argentina": "ARG",
    "Australia": "AUS",
    "Austria": "AUT",
    "Belgium": "BEL",
    "Bolivia": "BOL",
    "Bosnia & Herzegovina": "BIH",
    "Bosnia and Herzegovina": "BIH",
    "Brazil": "BRA",
    "Burkina Faso": "BFA",
    "Cameroon": "CMR",
    "Canada": "CAN",
    "Cape Verde": "CPV",
    "Chile": "CHI",
    "China": "CHN",
    "Colombia": "COL",
    "Costa Rica": "CRC",
    "Croatia": "CRO",
    "Curaçao": "CUW",
    "Curacao": "CUW",
    "Czech Republic": "CZE",
    "Czechia": "CZE",
    "Democratic Republic of the Congo": "COD",
    "DR Congo": "COD",
    "Congo DR": "COD",
    "CD Congo": "COD",
    "Congo-Kinshasa": "COD",
    "Denmark": "DEN",
    "Ecuador": "ECU",
    "Egypt": "EGY",
    "England": "ENG",
    "France": "FRA",
    "Germany": "GER",
    "Ghana": "GHA",
    "Greece": "GRE",
    "Haiti": "HAI",
    "Honduras": "HON",
    "Hungary": "HUN",
    "Iran": "IRN",
    "Iraq": "IRQ",
    "Ireland": "IRL",
    "Italy": "ITA",
    "Ivory Coast": "CIV",
    "Côte d'Ivoire": "CIV",
    "Jamaica": "JAM",
    "Japan": "JPN",
    "Jordan": "JOR",
    "Korea Republic": "KOR",
    "Republic of Korea": "KOR",
    "South Korea": "KOR",
    "Mali": "MLI",
    "Mexico": "MEX",
    "Morocco": "MAR",
    "Netherlands": "NED",
    "New Zealand": "NZL",
    "Nigeria": "NGA",
    "North Macedonia": "MKD",
    "Norway": "NOR",
    "Panama": "PAN",
    "Paraguay": "PAR",
    "Peru": "PER",
    "Poland": "POL",
    "Portugal": "POR",
    "Qatar": "QAT",
    "Romania": "ROU",
    "Saudi Arabia": "KSA",
    "Scotland": "SCO",
    "Senegal": "SEN",
    "Serbia": "SRB",
    "Slovakia": "SVK",
    "Slovenia": "SVN",
    "South Africa": "RSA",
    "Spain": "ESP",
    "Sweden": "SWE",
    "Switzerland": "SUI",
    "Tunisia": "TUN",
    "Turkey": "TUR",
    "Türkiye": "TUR",
    "Ukraine": "UKR",
    "United Arab Emirates": "UAE",
    "United States": "USA",
    "USA": "USA",
    "Uruguay": "URU",
    "Uzbekistan": "UZB",
    "Venezuela": "VEN",
    "Wales": "WAL"
};

let allMatches = [];

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("refreshWorldCup").addEventListener("click", () => {
        loadWorldCupData(true);
    });

    loadWorldCupData(true);

    setInterval(() => {
        loadWorldCupData(false);
    }, AUTO_REFRESH_MS);

    setInterval(() => {
        renderPage();
    }, 60 * 1000);
});

async function loadWorldCupData(showLoading) {
    const statusElement = document.getElementById("worldCupStatus");

    if (showLoading) {
        statusElement.textContent = "Laen MM-i andmeid...";
    }

    try {
        const response = await fetch(`${DATA_URL}?cacheBust=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const matches = data.matches
            .map(normalizeMatch)
            .sort((a, b) => a.kickoffDate - b.kickoffDate);

        let espnScoresLoaded = false;

        try {
            const espnMatches = await loadEspnScoreboard();
            mergeEspnScores(matches, espnMatches);
            espnScoresLoaded = true;
        } catch (espnError) {
            console.warn("ESPN score overlay failed:", espnError);
        }

        allMatches = matches;

        renderPage();

        document.getElementById("worldCupUpdated").textContent =
            `Uuendatud: ${formatTallinnDateTime(new Date())}`;

        statusElement.textContent = espnScoresLoaded
            ? `Laetud ${allMatches.length} mängu.`
            : `Laetud ${allMatches.length} mängu. ESPN-i skoorid pole hetkel saadaval.`;
    } catch (error) {
        console.error(error);
        statusElement.textContent =
            "MM-i andmeid ei õnnestunud laadida. Andmeallikas võib ajutiselt maas olla.";
    }
}

async function loadEspnScoreboard() {
    const response = await fetch(`${ESPN_SCOREBOARD_URL}&cacheBust=${Date.now()}`, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`ESPN HTTP ${response.status}`);
    }

    const data = await response.json();

    return (data.events || [])
        .map(normalizeEspnMatch)
        .filter(match => match !== null);
}

function normalizeMatch(match) {
    const kickoffDate = parseWorldCupDate(match.date, match.time);
    const score = getOpenFootballScoreIfReal(match, kickoffDate);
    const penaltyScore = getOpenFootballPenaltyIfReal(match, score);

    const stageName = match.group || match.round || "Other";
    const isGroupStage = Boolean(match.group);
    const roundKey = getRoundKey(stageName);

    const normalized = {
        id: `${match.date}-${match.time}-${match.team1}-${match.team2}`,
        raw: match,
        round: match.round || "",
        stageName,
        roundKey,
        group: match.group || "",
        isGroupStage,
        team1: cleanTeamName(match.team1),
        team2: cleanTeamName(match.team2),
        ground: match.ground || "",
        kickoffDate,
        tallinnDateKey: formatTallinnDateKey(kickoffDate),
        tallinnDateLabel: formatTallinnDateLabel(kickoffDate),
        tallinnShortDateLabel: formatTallinnShortDateLabel(kickoffDate),
        tallinnTimeLabel: formatTallinnTime(kickoffDate),
        score,
        penaltyScore,
        status: getMatchStatus(score, kickoffDate),
        statusDetail: "",
        winnerSide: null,
        winnerName: "",
        scoreSource: score ? "openfootball" : ""
    };

    applyWinnerFromScore(normalized);
    return normalized;
}

function normalizeEspnMatch(event) {
    const competition = event.competitions && event.competitions[0];

    if (!competition || !competition.competitors || competition.competitors.length < 2) {
        return null;
    }

    const home = competition.competitors.find(team => team.homeAway === "home") || competition.competitors[0];
    const away = competition.competitors.find(team => team.homeAway === "away") || competition.competitors[1];

    const homeName = getEspnTeamName(home);
    const awayName = getEspnTeamName(away);

    if (!homeName || !awayName) {
        return null;
    }

    const homeScore = Number(home.score);
    const awayScore = Number(away.score);
    const homePenalty = getEspnPenaltyScore(home);
    const awayPenalty = getEspnPenaltyScore(away);

    const statusType = event.status && event.status.type ? event.status.type : {};
    const completed = Boolean(statusType.completed);
    const state = String(statusType.state || "").toLowerCase();
    const name = String(statusType.name || "").toLowerCase();

    const hasScore = !Number.isNaN(homeScore) && !Number.isNaN(awayScore);
    const isLive =
        state === "in" ||
        state === "live" ||
        name.includes("in_progress") ||
        name.includes("in-progress");

    let winnerName = "";
    let winnerSide = null;

    if (home.winner) {
        winnerName = cleanTeamName(homeName);
        winnerSide = "team1";
    } else if (away.winner) {
        winnerName = cleanTeamName(awayName);
        winnerSide = "team2";
    }

    return {
        id: event.id,
        team1: cleanTeamName(homeName),
        team2: cleanTeamName(awayName),
        kickoffDate: new Date(event.date),
        completed,
        isLive,
        state,
        hasScore,
        score: hasScore
            ? {
                home: homeScore,
                away: awayScore
            }
            : null,
        penaltyScore:
            homePenalty !== null && awayPenalty !== null
                ? {
                    home: homePenalty,
                    away: awayPenalty
                }
                : null,
        winnerName,
        winnerSide,
        statusDetail: getEspnStatusDetail(event),
        ground: competition.venue && competition.venue.fullName ? competition.venue.fullName : ""
    };
}

function mergeEspnScores(matches, espnMatches) {
    const usedEspnIndexes = new Set();

    matches.forEach(match => {
        const espnIndex = findMatchingEspnMatch(match, espnMatches, usedEspnIndexes);

        if (espnIndex === -1) {
            return;
        }

        const espnMatch = espnMatches[espnIndex];
        usedEspnIndexes.add(espnIndex);

        const sameOrder =
            sameTeam(match.team1, espnMatch.team1) &&
            sameTeam(match.team2, espnMatch.team2);

        const reversedOrder =
            sameTeam(match.team1, espnMatch.team2) &&
            sameTeam(match.team2, espnMatch.team1);

        if (!sameOrder && !reversedOrder) {
            return;
        }

        if (espnMatch.ground) {
            match.ground = espnMatch.ground;
        }

        if (espnMatch.statusDetail) {
            match.statusDetail = espnMatch.statusDetail;
        }

        const espnScoreIsReal = espnMatch.hasScore && (espnMatch.completed || espnMatch.isLive);

        if (espnScoreIsReal && espnMatch.score) {
            match.score = sameOrder
                ? {
                    home: espnMatch.score.home,
                    away: espnMatch.score.away
                }
                : {
                    home: espnMatch.score.away,
                    away: espnMatch.score.home
                };

            match.scoreSource = "ESPN";
        }

        if (espnScoreIsReal && espnMatch.penaltyScore) {
            match.penaltyScore = sameOrder
                ? {
                    home: espnMatch.penaltyScore.home,
                    away: espnMatch.penaltyScore.away
                }
                : {
                    home: espnMatch.penaltyScore.away,
                    away: espnMatch.penaltyScore.home
                };
        }

        if (espnMatch.winnerName) {
            if (sameOrder) {
                match.winnerName = espnMatch.winnerName;
                match.winnerSide = espnMatch.winnerSide;
            } else {
                match.winnerName = espnMatch.winnerName;
                match.winnerSide = espnMatch.winnerSide === "team1" ? "team2" : "team1";
            }
        }

        if (espnMatch.completed) {
            match.status = "FINISHED";
        } else if (espnMatch.isLive) {
            match.status = "LIVE";
        } else {
            if (match.kickoffDate.getTime() > Date.now()) {
                match.score = null;
                match.penaltyScore = null;
                match.winnerSide = null;
                match.winnerName = "";
            }

            match.status = getMatchStatus(match.score, match.kickoffDate);
        }

        applyWinnerFromScore(match);
    });
}

function renderPage() {
    renderHeroStats();
    renderLiveGames();
    renderBracket();
    renderGroupResults();
}

function renderHeroStats() {
    const container = document.getElementById("worldCupHeroStats");

    const liveMatches = allMatches
        .filter(isLiveMatch)
        .sort((a, b) => a.kickoffDate - b.kickoffDate);

    const nextMatch = getNextMatch();

    container.innerHTML = `
        <div class="hero-stat next-game">
            <span>${liveMatches.length > 0 ? "Praegu käimas" : "Järgmine mäng"}</span>
            ${
                liveMatches.length > 0
                    ? renderHeroMatch(liveMatches[0], true)
                    : nextMatch
                        ? renderHeroMatch(nextMatch, false)
                        : `
                            <div class="next-game-content">
                                <div class="next-game-teams">
                                    <span>Tulevasi mänge pole</span>
                                </div>
                            </div>
                        `
            }
        </div>
    `;
}

function renderHeroMatch(match, isLive) {
    return `
        <div class="next-game-content">
            <div class="next-game-teams">
                ${renderTeamLabel(match.team1)}
                <span class="team-vs">vs</span>
                ${renderTeamLabel(match.team2)}
            </div>
            <em class="hero-stat-time">
                ${
                    isLive
                        ? `${getDisplayScore(match)} · ${getLiveDisplayText(match)}`
                        : `${match.tallinnDateLabel}, ${match.tallinnTimeLabel} Eesti aeg`
                }
            </em>
        </div>
    `;
}

function renderLiveGames() {
    const container = document.getElementById("liveGamesGrid");

    const liveMatches = allMatches
        .filter(isLiveMatch)
        .sort((a, b) => a.kickoffDate - b.kickoffDate);

    if (liveMatches.length === 0) {
        const nextMatch = getNextMatch();

        container.innerHTML = `
            <div class="no-live-card">
                ${
                    nextMatch
                        ? `Pole laiv mängu. Järgmine: ${renderTeamLabel(nextMatch.team1)} vs ${renderTeamLabel(nextMatch.team2)} kell ${nextMatch.tallinnTimeLabel} Eesti aja järgi.`
                        : "Pole laiv mängu."
                }
            </div>
        `;
        return;
    }

    container.innerHTML = liveMatches.map(match => `
        <article class="live-card">
            <div class="live-team">
                ${renderTeamLabel(match.team1)}
                <span class="live-meta">${escapeHtml(match.ground)}</span>
            </div>

            <div class="live-score">
                <strong>${escapeHtml(getDisplayScore(match))}</strong>
                <span>${escapeHtml(getLiveDisplayText(match))}</span>
            </div>

            <div class="live-team away">
                ${renderTeamLabel(match.team2)}
                <span class="live-meta">${escapeHtml(displayStageName(match.stageName))}</span>
            </div>
        </article>
    `).join("");
}

function renderBracket() {
    const container = document.getElementById("bracketContainer");

    const knockoutMatches = allMatches
        .filter(match => !match.isGroupStage && match.roundKey !== "THIRD")
        .map(match => ({ ...match }));

    if (knockoutMatches.length === 0) {
        container.innerHTML = `<p class="empty-state">No knockout matches found yet.</p>`;
        return;
    }

    const bracketData = buildBracketData(knockoutMatches);

    container.innerHTML = `
        <div class="bracket-shell">
            <div class="bracket-titles">
                <div class="bracket-title">1/16</div>
                <div class="bracket-title">1/8</div>
                <div class="bracket-title">Veerandid</div>
                <div class="bracket-title">Semid</div>
                <div class="bracket-title">Finaal</div>
                <div class="bracket-title">Semid</div>
                <div class="bracket-title">Veerandid</div>
                <div class="bracket-title">1/8</div>
                <div class="bracket-title">1/16</div>
            </div>

            <div class="bracket-board">
                ${renderPositionedRound(bracketData.R32.left, 1, "side-left", "r32", [1, 3, 5, 7, 9, 11, 13, 15], true, false)}
                ${renderPositionedRound(bracketData.R16.left, 2, "side-left", "r16", [2, 6, 10, 14], true, true)}
                ${renderPositionedRound(bracketData.QF.left, 3, "side-left", "qf", [4, 12], true, true)}
                ${renderPositionedRound(bracketData.SF.left, 4, "side-left", "sf", [8], true, true)}

                ${renderPositionedFinal(bracketData.FINAL.matches[0] || createPlaceholderMatch("Final"))}

                ${renderPositionedRound(bracketData.SF.right, 6, "side-right", "sf", [8], true, true)}
                ${renderPositionedRound(bracketData.QF.right, 7, "side-right", "qf", [4, 12], true, true)}
                ${renderPositionedRound(bracketData.R16.right, 8, "side-right", "r16", [2, 6, 10, 14], true, true)}
                ${renderPositionedRound(bracketData.R32.right, 9, "side-right", "r32", [1, 3, 5, 7, 9, 11, 13, 15], true, false)}

                ${renderPositionedThirdPlace()}
            </div>
        </div>
    `;
}

function renderPositionedRound(matches, column, sideClass, roundClass, rows, hasOutput, hasInput) {
    const filledMatches = rows.map((row, index) => {
        return matches[index] || createPlaceholderMatch(roundClass);
    });

    return filledMatches.map((match, index) => {
        const row = rows[index];
        return renderBracketMatch(match, {
            column,
            row,
            sideClass,
            roundClass,
            hasOutput,
            hasInput
        });
    }).join("");
}

function renderPositionedFinal(match) {
    return renderBracketMatch(match, {
        column: 5,
        row: 7,
        sideClass: "side-center",
        roundClass: "final-match",
        hasOutput: false,
        hasInput: true
    });
}

function renderPositionedThirdPlace() {
    const thirdPlace = allMatches.find(match => match.roundKey === "THIRD");

    if (!thirdPlace) {
        return "";
    }

    return renderBracketMatch(thirdPlace, {
        column: 5,
        row: 12,
        sideClass: "side-center",
        roundClass: "third-place-match",
        hasOutput: false,
        hasInput: false
    });
}

function renderBracketMatch(match, position) {
    const statusClass = isLiveMatch(match)
        ? "live"
        : match.status === "FINISHED"
            ? "finished"
            : "scheduled";

    const outputClass = position.hasOutput ? "has-output" : "";
    const inputClass = position.hasInput ? "has-input" : "";

    return `
        <article
            class="bracket-match ${statusClass} ${position.sideClass} ${position.roundClass} ${outputClass} ${inputClass}"
            style="grid-column: ${position.column}; grid-row: ${position.row} / span 2;"
        >
            <div class="bracket-match-meta">${escapeHtml(getBracketMatchStatus(match))}</div>
            ${renderBracketTeam(match, "team1")}
            ${renderBracketTeam(match, "team2")}
        </article>
    `;
}

function renderBracketTeam(match, side) {
    const isTeam1 = side === "team1";
    const teamName = isTeam1 ? match.team1 : match.team2;
    const scoreText = getSideScoreText(match, side);
    const isWinner = match.winnerSide === side;
    const isLoser = match.winnerSide && match.winnerSide !== side;

    return `
        <div class="bracket-team ${isWinner ? "winner" : ""} ${isLoser ? "loser" : ""}">
            <div>${renderTeamLabel(teamName)}</div>
            <div class="bracket-score-cell">${scoreText}</div>
        </div>
    `;
}

function buildBracketData(knockoutMatches) {
    const byRound = {
        R32: getRoundMatches(knockoutMatches, "R32"),
        R16: getRoundMatches(knockoutMatches, "R16"),
        QF: getRoundMatches(knockoutMatches, "QF"),
        SF: getRoundMatches(knockoutMatches, "SF"),
        FINAL: getRoundMatches(knockoutMatches, "FINAL")
    };

    fillNextRoundFromWinners(byRound.R32, byRound.R16);
    fillNextRoundFromWinners(byRound.R16, byRound.QF);
    fillNextRoundFromWinners(byRound.QF, byRound.SF);
    fillNextRoundFromWinners(byRound.SF, byRound.FINAL);

    return {
        R32: splitRound(byRound.R32, 8),
        R16: splitRound(byRound.R16, 4),
        QF: splitRound(byRound.QF, 2),
        SF: splitRound(byRound.SF, 1),
        FINAL: {
            matches: byRound.FINAL.length > 0 ? byRound.FINAL : [createPlaceholderMatch("Final")]
        }
    };
}

function getRoundMatches(matches, roundKey) {
    return matches
        .filter(match => match.roundKey === roundKey)
        .sort(compareMatchesForBracket);
}

function splitRound(matches, leftCount) {
    return {
        left: matches.slice(0, leftCount),
        right: matches.slice(leftCount)
    };
}

function fillNextRoundFromWinners(previousRound, nextRound) {
    if (!previousRound.length || !nextRound.length) {
        return;
    }

    nextRound.forEach((match, index) => {
        const firstWinner = getMatchWinnerName(previousRound[index * 2]);
        const secondWinner = getMatchWinnerName(previousRound[index * 2 + 1]);

        if (firstWinner && isPlaceholderTeam(match.team1)) {
            match.team1 = firstWinner;
        }

        if (secondWinner && isPlaceholderTeam(match.team2)) {
            match.team2 = secondWinner;
        }
    });
}

function renderGroupResults() {
    const container = document.getElementById("groupResultsGrid");

    const groupMatches = allMatches
        .filter(match => match.isGroupStage)
        .sort((a, b) => a.kickoffDate - b.kickoffDate);

    if (groupMatches.length === 0) {
        container.innerHTML = `<p class="empty-state">Alagrupimänge ei leitud.</p>`;
        return;
    }

    const groups = groupBy(groupMatches, match => match.stageName);
    const groupNames = Object.keys(groups).sort(compareStages);

    container.innerHTML = groupNames.map(groupName => {
        const stageMatches = groups[groupName].sort((a, b) => a.kickoffDate - b.kickoffDate);
        const byDate = groupBy(stageMatches, match => match.tallinnDateLabel);
        const dateNames = Object.keys(byDate);

        return `
            <article class="stage-card">
                <div class="card-header">
                    <h3>${escapeHtml(displayStageName(groupName))}</h3>
                    <span>${stageMatches.length} mängu</span>
                </div>

                ${dateNames.map(dateName => `
                    <div class="day-block">
                        <h4 class="day-title">${escapeHtml(dateName)}</h4>
                        ${byDate[dateName].map(renderGroupMatch).join("")}
                    </div>
                `).join("")}
            </article>
        `;
    }).join("");
}

function renderGroupMatch(match) {
    const badge = getStatusBadge(match);

    return `
        <div class="match-row">
            <div class="match-topline">
                <span>${escapeHtml(displayRoundName(match.round))}</span>
                <span>${badge}</span>
            </div>

            <div class="match-main">
                <strong>${renderTeamLabel(match.team1)}</strong>
                <span class="score-box">${escapeHtml(getDisplayScore(match))}</span>
                <strong>${renderTeamLabel(match.team2)}</strong>
            </div>

            <div class="match-meta">
                <span>${escapeHtml(match.tallinnTimeLabel)} Eesti aeg</span>
                <span>${escapeHtml(match.ground)}</span>
            </div>
        </div>
    `;
}

function getStatusBadge(match) {
    if (match.status === "FINISHED") {
        return `<span class="status-badge status-finished">Läbi</span>`;
    }

    if (isLiveMatch(match)) {
        return `<span class="status-badge status-live">LAIV · ${escapeHtml(getLiveDisplayText(match))}</span>`;
    }

    if (match.status === "MISSING_RESULT") {
        return `<span class="status-badge status-missing">Ootab tulemust</span>`;
    }

    return `<span class="status-badge status-scheduled">Tulekul</span>`;
}

function getNextMatch() {
    const now = Date.now();

    return allMatches
        .filter(match => {
            return match.status !== "FINISHED" && match.kickoffDate.getTime() > now;
        })
        .sort((a, b) => a.kickoffDate - b.kickoffDate)[0] || null;
}

function getOpenFootballScoreIfReal(rawMatch, kickoffDate) {
    const score = getScore(rawMatch);

    if (!score) {
        return null;
    }

    const now = Date.now();
    const kickoff = kickoffDate.getTime();

    if (kickoff > now) {
        return null;
    }

    const enoughTimePassedForResult = now >= kickoff + 150 * 60 * 1000;
    const hasPenaltyScore = Boolean(getPenaltyScore(rawMatch));

    if (!enoughTimePassedForResult && !hasPenaltyScore) {
        return null;
    }

    return score;
}

function getOpenFootballPenaltyIfReal(rawMatch, score) {
    if (!score) {
        return null;
    }

    return getPenaltyScore(rawMatch);
}

function getScore(match) {
    if (!match.score) {
        return null;
    }

    const candidates = [
        match.score.ft,
        match.score.aet,
        match.score.et,
        match.score.fulltime,
        match.score.fullTime
    ];

    for (const candidate of candidates) {
        const parsed = parseScoreArray(candidate);
        if (parsed) {
            return parsed;
        }
    }

    return null;
}

function getPenaltyScore(match) {
    if (!match.score) {
        return null;
    }

    const candidates = [
        match.score.penalties,
        match.score.pens,
        match.score.pen,
        match.score.p,
        match.score.shootout
    ];

    for (const candidate of candidates) {
        const parsed = parseScoreArray(candidate);
        if (parsed) {
            return parsed;
        }
    }

    return null;
}

function parseScoreArray(value) {
    if (!Array.isArray(value) || value.length < 2) {
        return null;
    }

    const home = Number(value[0]);
    const away = Number(value[1]);

    if (Number.isNaN(home) || Number.isNaN(away)) {
        return null;
    }

    return { home, away };
}

function parseOptionalNumber(value) {
    if (value === undefined || value === null || value === "") {
        return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function getEspnTeamName(competitor) {
    if (!competitor || !competitor.team) {
        return "";
    }

    return (
        competitor.team.displayName ||
        competitor.team.shortDisplayName ||
        competitor.team.name ||
        ""
    );
}

function getEspnStatusDetail(event) {
    if (!event || !event.status) {
        return "";
    }

    return (
        event.status.type && event.status.type.shortDetail ||
        event.status.type && event.status.type.detail ||
        event.status.shortDetail ||
        event.status.detail ||
        ""
    );
}

function getEspnPenaltyScore(competitor) {
    const directCandidates = [
        competitor.shootoutScore,
        competitor.penaltyScore,
        competitor.penalties,
        competitor.penaltyShootoutScore
    ];

    for (const candidate of directCandidates) {
        const parsed = parseOptionalNumber(candidate);
        if (parsed !== null) {
            return parsed;
        }
    }

    if (Array.isArray(competitor.linescores)) {
        const penaltyLine = competitor.linescores.find(line => {
            const label = String(line.displayName || line.name || line.period || "").toLowerCase();
            return label.includes("pen") || label.includes("shootout");
        });

        if (penaltyLine) {
            const parsed = parseOptionalNumber(penaltyLine.value || penaltyLine.score);
            if (parsed !== null) {
                return parsed;
            }
        }
    }

    return null;
}

function applyWinnerFromScore(match) {
    if (!match.score) {
        return;
    }

    if (match.score.home > match.score.away) {
        match.winnerSide = "team1";
        match.winnerName = match.team1;
        return;
    }

    if (match.score.away > match.score.home) {
        match.winnerSide = "team2";
        match.winnerName = match.team2;
        return;
    }

    if (match.penaltyScore) {
        if (match.penaltyScore.home > match.penaltyScore.away) {
            match.winnerSide = "team1";
            match.winnerName = match.team1;
        } else if (match.penaltyScore.away > match.penaltyScore.home) {
            match.winnerSide = "team2";
            match.winnerName = match.team2;
        }
    }
}

function findMatchingEspnMatch(match, espnMatches, usedEspnIndexes) {
    let bestIndex = -1;
    let bestTimeDifference = Infinity;

    espnMatches.forEach((espnMatch, index) => {
        if (usedEspnIndexes.has(index)) {
            return;
        }

        if (!sameTeamPair(match, espnMatch)) {
            return;
        }

        const timeDifference = Math.abs(match.kickoffDate.getTime() - espnMatch.kickoffDate.getTime());

        if (timeDifference < bestTimeDifference && timeDifference <= 36 * 60 * 60 * 1000) {
            bestIndex = index;
            bestTimeDifference = timeDifference;
        }
    });

    return bestIndex;
}

function sameTeamPair(match, espnMatch) {
    const sameOrder =
        sameTeam(match.team1, espnMatch.team1) &&
        sameTeam(match.team2, espnMatch.team2);

    const reversedOrder =
        sameTeam(match.team1, espnMatch.team2) &&
        sameTeam(match.team2, espnMatch.team1);

    return sameOrder || reversedOrder;
}

function getMatchStatus(score, kickoffDate) {
    const now = new Date();
    const start = kickoffDate.getTime();
    const estimatedEnd = start + 180 * 60 * 1000;

    if (score && now.getTime() >= start + 100 * 60 * 1000) {
        return "FINISHED";
    }

    if (now.getTime() >= start && now.getTime() <= estimatedEnd) {
        return "LIVE_ESTIMATE";
    }

    if (now < kickoffDate) {
        return "SCHEDULED";
    }

    return "MISSING_RESULT";
}

function getBracketMatchStatus(match) {
    if (isLiveMatch(match)) {
        return getLiveDisplayText(match);
    }

    if (match.status === "FINISHED") {
        return "Läbi";
    }

    if (!match.tallinnShortDateLabel || !match.tallinnTimeLabel) {
        return "";
    }

    return `${match.tallinnShortDateLabel} · ${match.tallinnTimeLabel}`;
}

function getDisplayScore(match) {
    if (!match.score) {
        return "vs";
    }

    return `${match.score.home} - ${match.score.away}`;
}

function getSideScoreText(match, side) {
    if (!match.score) {
        return "";
    }

    const mainScore = side === "team1"
        ? String(match.score.home)
        : String(match.score.away);

    const penaltyScore = getSidePenaltyScore(match, side);

    if (penaltyScore === "") {
        return mainScore;
    }

    return `${mainScore} <span class="pen-score">(${penaltyScore})</span>`;
}

function getSidePenaltyScore(match, side) {
    if (!match.penaltyScore) {
        return "";
    }

    return side === "team1"
        ? String(match.penaltyScore.home)
        : String(match.penaltyScore.away);
}

function getLiveDisplayText(match) {
    if (match.statusDetail) {
        return match.statusDetail;
    }

    return getEstimatedMinute(match.kickoffDate);
}

function getEstimatedMinute(kickoffDate) {
    const elapsedMinutes = Math.max(0, Math.floor((new Date() - kickoffDate) / 60000));

    if (elapsedMinutes <= 45) {
        return `~${elapsedMinutes}'`;
    }

    if (elapsedMinutes <= 60) {
        return "Vaheaeg?";
    }

    if (elapsedMinutes <= 120) {
        return `~${Math.min(120, elapsedMinutes - 15)}'`;
    }

    return "Lisaaeg/penaltid?";
}

function isLiveMatch(match) {
    return match.status === "LIVE" || match.status === "LIVE_ESTIMATE";
}

function getMatchWinnerName(match) {
    if (!match) {
        return "";
    }

    if (match.winnerName) {
        return match.winnerName;
    }

    if (match.winnerSide === "team1") {
        return match.team1;
    }

    if (match.winnerSide === "team2") {
        return match.team2;
    }

    return "";
}

function createPlaceholderMatch(stageName) {
    const now = new Date();

    return {
        id: `placeholder-${stageName}-${Math.random()}`,
        round: stageName,
        stageName,
        roundKey: getRoundKey(stageName),
        group: "",
        isGroupStage: false,
        team1: "TBD",
        team2: "TBD",
        ground: "",
        kickoffDate: now,
        tallinnDateKey: "",
        tallinnDateLabel: "",
        tallinnShortDateLabel: "",
        tallinnTimeLabel: "",
        score: null,
        penaltyScore: null,
        status: "SCHEDULED",
        statusDetail: "",
        winnerSide: null,
        winnerName: "",
        scoreSource: ""
    };
}

function compareMatchesForBracket(a, b) {
    return a.kickoffDate - b.kickoffDate || a.id.localeCompare(b.id);
}

function cleanTeamName(name) {
    const replacements = {
        "Czech Republic": "Czechia",
        "USA": "United States"
    };

    return replacements[name] || name;
}

function renderTeamLabel(teamName) {
    const cleanName = escapeHtml(teamName);
    const flagCode = getFlagCode(teamName);
    const teamCode = escapeHtml(getTeamCode(teamName));

    const nameHtml = `
        <span class="team-name-full">${cleanName}</span>
        <span class="team-name-code" title="${cleanName}">${teamCode}</span>
    `;

    if (!flagCode) {
        return `<span class="team-with-flag">${nameHtml}</span>`;
    }

    return `
        <span class="team-with-flag">
            <img
                class="team-flag"
                src="https://flagcdn.com/w40/${flagCode}.png"
                alt=""
                loading="lazy"
            >
            ${nameHtml}
        </span>
    `;
}

function getFlagCode(teamName) {
    return TEAM_FLAGS[teamName] || null;
}

function getTeamCode(teamName) {
    if (TEAM_CODES[teamName]) {
        return TEAM_CODES[teamName];
    }

    if (isPlaceholderTeam(teamName)) {
        return String(teamName ?? "TBD").toUpperCase();
    }

    return String(teamName ?? "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase();
}

function isPlaceholderTeam(teamName) {
    const value = String(teamName ?? "").toLowerCase().trim();

    return (
        !value ||
        value === "tbd" ||
        /^[wl]\s*\d+$/.test(value) ||
        value.includes("winner") ||
        value.includes("runner-up") ||
        value.includes("third place") ||
        value.includes("match")
    );
}

function sameTeam(a, b) {
    return normalizeTeamKey(a) === normalizeTeamKey(b);
}

function normalizeTeamKey(teamName) {
    let value = String(teamName ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

    const aliases = {
        "usa": "united states",
        "united states": "united states",

        "bosnia herzegovina": "bosnia and herzegovina",
        "bosnia and herzegovina": "bosnia and herzegovina",

        "czech republic": "czechia",
        "czechia": "czechia",

        "korea republic": "republic of korea",
        "south korea": "republic of korea",
        "republic of korea": "republic of korea",

        "dr congo": "dr congo",
        "congo dr": "dr congo",
        "cd congo": "dr congo",
        "democratic republic of the congo": "dr congo",

        "curacao": "curacao",
        "curacao national football team": "curacao"
    };

    return aliases[value] || value;
}

function parseWorldCupDate(dateText, timeText) {
    const dateParts = dateText.split("-").map(Number);
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];

    const match = String(timeText).match(/^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})$/i);

    if (!match) {
        return new Date(`${dateText}T00:00:00Z`);
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const utcOffsetHours = Number(match[3]);

    const utcMilliseconds = Date.UTC(
        year,
        month - 1,
        day,
        hour - utcOffsetHours,
        minute,
        0
    );

    return new Date(utcMilliseconds);
}

function getRoundKey(stageName) {
    const value = String(stageName ?? "").toLowerCase();

    if (value.startsWith("group")) {
        return "GROUP";
    }

    if (value.includes("third")) {
        return "THIRD";
    }

    if (value.includes("semi")) {
        return "SF";
    }

    if (value.includes("quarter")) {
        return "QF";
    }

    if (value.includes("round of 16") || value.includes("last 16")) {
        return "R16";
    }

    if (value.includes("round of 32") || value.includes("last 32")) {
        return "R32";
    }

    if (value.includes("final")) {
        return "FINAL";
    }

    return "OTHER";
}

function groupBy(items, keyFunction) {
    return items.reduce((groups, item) => {
        const key = keyFunction(item);

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(item);
        return groups;
    }, {});
}

function compareStages(a, b) {
    return getStageOrder(a) - getStageOrder(b) || a.localeCompare(b);
}

function getStageOrder(stageName) {
    const groupMatch = stageName.match(/^Group ([A-L])$/);

    if (groupMatch) {
        return groupMatch[1].charCodeAt(0) - "A".charCodeAt(0);
    }

    const order = {
        "Round of 32": 100,
        "Round of 16": 110,
        "Quarter-final": 120,
        "Quarter-final 1": 121,
        "Quarter-final 2": 122,
        "Quarter-final 3": 123,
        "Quarter-final 4": 124,
        "Semi-final": 130,
        "Semi-final 1": 131,
        "Semi-final 2": 132,
        "Match for third place": 140,
        "Third place": 140,
        "Final": 150
    };

    return order[stageName] || 999;
}

function formatTallinnDateTime(date) {
    return new Intl.DateTimeFormat("et-EE", {
        timeZone: TALLINN_TIME_ZONE,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function formatTallinnDateKey(date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TALLINN_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

function formatTallinnDateLabel(date) {
    return new Intl.DateTimeFormat("et-EE", {
        timeZone: TALLINN_TIME_ZONE,
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(date);
}

function formatTallinnShortDateLabel(date) {
    return new Intl.DateTimeFormat("et-EE", {
        timeZone: TALLINN_TIME_ZONE,
        day: "2-digit",
        month: "2-digit"
    }).format(date);
}

function formatTallinnTime(date) {
    return new Intl.DateTimeFormat("et-EE", {
        timeZone: TALLINN_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function displayStageName(value) {
    const text = String(value ?? "");
    const lower = text.toLowerCase();

    const groupMatch = text.match(/^Group ([A-L])$/i);

    if (groupMatch) {
        return `Grupp ${groupMatch[1].toUpperCase()}`;
    }

    if (lower.includes("round of 32") || lower.includes("last 32")) {
        return "1/16-finaal";
    }

    if (lower.includes("round of 16") || lower.includes("last 16")) {
        return "kaheksandikfinaal";
    }

    if (lower.includes("quarter")) {
        return "veerandfinaal";
    }

    if (lower.includes("semi")) {
        return "poolfinaal";
    }

    if (lower.includes("match for third place") || lower.includes("third place")) {
        return "kolmanda koha mäng";
    }

    if (lower.includes("final")) {
        return "finaal";
    }

    return text;
}

function displayRoundName(value) {
    const text = String(value ?? "");
    const matchday = text.match(/^Matchday\s+(\d+)$/i);

    if (matchday) {
        return `${matchday[1]}. turnamendi päev`;
    }

    return displayStageName(text);
}

function translateStatusDetail(value) {
    const text = String(value ?? "");
    const lower = text.toLowerCase();
    const trimmed = text.trim();

    if (!trimmed) {
        return "";
    }

    if (/^\d+(\+\d+)?['’]?$/.test(trimmed)) {
        return trimmed;
    }

    if (lower === "ft" || lower === "final" || lower.includes("full time")) {
        return "Läbi";
    }

    if (lower === "ht" || lower.includes("half")) {
        return "Vaheaeg";
    }

    if (lower.includes("pen")) {
        return "Penaltid";
    }

    if (lower.includes("extra")) {
        return "Lisaaeg";
    }

    if (lower.includes("delayed")) {
        return "Viibib";
    }

    if (lower.includes("postponed")) {
        return "Edasi lükatud";
    }

    if (lower.includes("canceled") || lower.includes("cancelled")) {
        return "Tühistatud";
    }

    return text;
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const escapes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        };

        return escapes[character];
    });
}