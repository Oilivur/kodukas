const DATA_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const ESPN_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?limit=950&dates=20260611-20260719";
const TALLINN_TIME_ZONE = "Europe/Tallinn";
const AUTO_REFRESH_MS = 5 * 60 * 1000;

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

    document.getElementById("teamSearch").addEventListener("input", () => {
        renderPage();
    });

    document.getElementById("stageFilter").addEventListener("change", () => {
        renderPage();
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
            console.warn("ESPN skooride feil:", espnError);
        }

        allMatches = matches;

        populateStageFilter();
        renderPage();

        document.getElementById("worldCupUpdated").textContent =
            `Uuendatud: ${formatTallinnDateTime(new Date())}`;
    } catch (error) {
        console.error(error);
        statusElement.textContent =
            "Ei saanud infi kätte...";
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

    const completed = Boolean(event.status && event.status.type && event.status.type.completed);
    const hasScore = !Number.isNaN(homeScore) && !Number.isNaN(awayScore);

    return {
        id: event.id,
        team1: cleanTeamName(homeName),
        team2: cleanTeamName(awayName),
        kickoffDate: new Date(event.date),
        completed,
        hasScore,
        score: hasScore
            ? {
                home: homeScore,
                away: awayScore
            }
            : null
    };
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

function mergeEspnScores(matches, espnMatches) {
    const usedEspnIndexes = new Set();

    matches.forEach(match => {
        const espnIndex = findMatchingEspnMatch(match, espnMatches, usedEspnIndexes);

        if (espnIndex === -1) {
            return;
        }

        const espnMatch = espnMatches[espnIndex];

        if (!espnMatch.completed || !espnMatch.hasScore) {
            return;
        }

        usedEspnIndexes.add(espnIndex);

        const sameOrder =
            sameTeam(match.team1, espnMatch.team1) &&
            sameTeam(match.team2, espnMatch.team2);

        const reversedOrder =
            sameTeam(match.team1, espnMatch.team2) &&
            sameTeam(match.team2, espnMatch.team1);

        if (sameOrder) {
            match.score = {
                home: espnMatch.score.home,
                away: espnMatch.score.away
            };
        } else if (reversedOrder) {
            match.score = {
                home: espnMatch.score.away,
                away: espnMatch.score.home
            };
        } else {
            return;
        }

        match.status = "FINISHED";
        match.scoreSource = "ESPN";
    });
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

function normalizeMatch(match) {
    const kickoffDate = parseWorldCupDate(match.date, match.time);
    const score = getScore(match);

    const stageName = match.group || match.round || "Other";
    const isGroupStage = Boolean(match.group);

    return {
        id: `${match.date}-${match.time}-${match.team1}-${match.team2}`,
        round: match.round || "",
        stageName,
        group: match.group || "",
        isGroupStage,
        team1: cleanTeamName(match.team1),
        team2: cleanTeamName(match.team2),
        ground: match.ground || "",
        kickoffDate,
        tallinnDateKey: formatTallinnDateKey(kickoffDate),
        tallinnDateLabel: formatTallinnDateLabel(kickoffDate),
        tallinnTimeLabel: formatTallinnTime(kickoffDate),
        score,
        status: getMatchStatus(score, kickoffDate)
    };
}

function cleanTeamName(name) {
    const replacements = {
        "Czech Republic": "Czechia",
        "USA": "United States"
    };

    return replacements[name] || name;
}

function getScore(match) {
    if (!match.score || !match.score.ft || match.score.ft.length < 2) {
        return null;
    }

    return {
        home: Number(match.score.ft[0]),
        away: Number(match.score.ft[1])
    };
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

function getMatchStatus(score, kickoffDate) {
    if (score) {
        return "FINISHED";
    }

    const now = new Date();
    const start = kickoffDate.getTime();
    const estimatedEnd = start + 130 * 60 * 1000;

    if (now.getTime() >= start && now.getTime() <= estimatedEnd) {
        return "LIVE_ESTIMATE";
    }

    if (now < kickoffDate) {
        return "SCHEDULED";
    }

    return "MISSING_RESULT";
}

function populateStageFilter() {
    const select = document.getElementById("stageFilter");
    const currentValue = select.value;

    const stages = [...new Set(allMatches.map(match => match.stageName))]
        .sort(compareStages);

    select.innerHTML = `<option value="">Kogu värk</option>`;

    stages.forEach(stage => {
        const option = document.createElement("option");
        option.value = stage;
        option.textContent = stage;
        select.appendChild(option);
    });

    select.value = currentValue;
}

function renderPage() {
    const visibleData = getVisibleData();

    renderHeroStats();
    renderStandings(visibleData.standingMatches);
    renderMatches(visibleData.matches);
}

function getVisibleData() {
    const search = document.getElementById("teamSearch").value.trim();
    const selectedStage = document.getElementById("stageFilter").value;

    const stageMatches = allMatches.filter(match => {
        return !selectedStage || match.stageName === selectedStage;
    });

    if (!search) {
        return {
            matches: stageMatches,
            standingMatches: stageMatches
        };
    }

    const visibleGroups = new Set();
    const visibleKnockoutMatchIds = new Set();

    stageMatches.forEach(match => {
        const foundTeam =
            teamMatchesSearch(match.team1, search) ||
            teamMatchesSearch(match.team2, search);

        if (!foundTeam) {
            return;
        }

        if (match.isGroupStage) {
            visibleGroups.add(match.group);
        } else {
            visibleKnockoutMatchIds.add(match.id);
        }
    });

    const visibleGroupMatches = stageMatches.filter(match => {
        return match.isGroupStage && visibleGroups.has(match.group);
    });

    const visibleKnockoutMatches = stageMatches.filter(match => {
        return !match.isGroupStage && visibleKnockoutMatchIds.has(match.id);
    });

    return {
        matches: [
            ...visibleGroupMatches,
            ...visibleKnockoutMatches
        ],
        standingMatches: visibleGroupMatches
    };
}

function teamMatchesSearch(teamName, search) {
    const query = normalizeSearchText(search);

    if (!query) {
        return true;
    }

    const teamCode = typeof getTeamCode === "function"
        ? getTeamCode(teamName)
        : "";

    const aliasName = typeof normalizeTeamKey === "function"
        ? normalizeTeamKey(teamName)
        : "";

    const searchableTeamText = normalizeSearchText([
        teamName,
        teamCode,
        aliasName
    ].join(" "));

    return searchableTeamText.includes(query);
}

function normalizeSearchText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function renderHeroStats() {
    const container = document.getElementById("worldCupHeroStats");

    const finished = allMatches.filter(match => match.status === "FINISHED").length;
    const gamesLeft = allMatches.filter(match => match.status !== "FINISHED").length;

    const nextMatch = allMatches.find(match => {
        return !match.score && match.kickoffDate > new Date();
    });

    container.innerHTML = `
        <div class="hero-stat">
            <span>Lõppenud</span>
            <strong>${finished}</strong>
        </div>

        <div class="hero-stat">
            <span>Mänge jäänud</span>
            <strong>${gamesLeft}</strong>
        </div>

        <div class="hero-stat next-game">
            <span>Järgmine mäng</span>
            ${
                nextMatch
                    ? `
                        <div class="next-game-content">
                            <div class="next-game-teams">
                                ${renderTeamLabel(nextMatch.team1)}
                                <span class="team-vs">vs</span>
                                ${renderTeamLabel(nextMatch.team2)}
                            </div>
                            <em class="hero-stat-time">
                                ${nextMatch.tallinnDateLabel}, ${nextMatch.tallinnTimeLabel} Eesti aeg
                            </em>
                        </div>
                    `
                    : `
                        <div class="next-game-content">
                            <div class="next-game-teams">
                                <span>Pole tulevat mängu</span>
                            </div>
                        </div>
                    `
            }
        </div>
    `;
}

function renderStandings(matches) {
    const container = document.getElementById("standingsGrid");
    const standings = calculateStandings(matches);

    const groupNames = Object.keys(standings).sort(compareStages);

    if (groupNames.length === 0) {
        container.innerHTML = `<p class="empty-state">Ei leidnud mänge.</p>`;
        return;
    }

    container.innerHTML = groupNames.map(groupName => {
        const teams = standings[groupName];

        return `
            <article class="standing-card">
                <div class="card-header">
                    <h3>${escapeHtml(groupName)}</h3>
                    <span>${teams.length} Meeskonda</span>
                </div>

                <table class="standing-table">
                    <thead>
                        <tr>
                            <th>Team</th>
                            <th>MP</th>
                            <th>W</th>
                            <th>D</th>
                            <th>L</th>
                            <th>GD</th>
                            <th>Pts</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${teams.map((team, index) => `
                            <tr>
                                <td class="team-name">
                                    <span class="standing-team-wrap">
                                        <span class="rank-pill ${index < 2 ? "qualifies" : ""}">
                                            ${index + 1}
                                        </span>
                                        ${renderTeamLabel(team.name)}
                                    </span>
                                </td>
                                <td>${team.played}</td>
                                <td>${team.won}</td>
                                <td>${team.drawn}</td>
                                <td>${team.lost}</td>
                                <td>${team.goalDifference}</td>
                                <td class="points">${team.points}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </article>
        `;
    }).join("");
}

function calculateStandings(matches) {
    const groups = {};

    matches
        .filter(match => match.isGroupStage)
        .forEach(match => {
            if (!groups[match.group]) {
                groups[match.group] = {};
            }

            ensureTeam(groups[match.group], match.team1);
            ensureTeam(groups[match.group], match.team2);

            if (!match.score) {
                return;
            }

            const home = groups[match.group][match.team1];
            const away = groups[match.group][match.team2];

            const homeGoals = match.score.home;
            const awayGoals = match.score.away;

            home.played += 1;
            away.played += 1;

            home.goalsFor += homeGoals;
            home.goalsAgainst += awayGoals;

            away.goalsFor += awayGoals;
            away.goalsAgainst += homeGoals;

            if (homeGoals > awayGoals) {
                home.won += 1;
                away.lost += 1;
                home.points += 3;
            } else if (homeGoals < awayGoals) {
                away.won += 1;
                home.lost += 1;
                away.points += 3;
            } else {
                home.drawn += 1;
                away.drawn += 1;
                home.points += 1;
                away.points += 1;
            }

            home.goalDifference = home.goalsFor - home.goalsAgainst;
            away.goalDifference = away.goalsFor - away.goalsAgainst;
        });

    const sortedGroups = {};

    Object.keys(groups).forEach(groupName => {
        sortedGroups[groupName] = Object.values(groups[groupName]).sort(compareTeams);
    });

    return sortedGroups;
}

function ensureTeam(group, teamName) {
    if (group[teamName]) {
        return;
    }

    group[teamName] = {
        name: teamName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0
    };
}

function compareTeams(a, b) {
    return (
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.name.localeCompare(b.name)
    );
}

function renderMatches(matches) {
    const container = document.getElementById("matchesGrid");

    if (matches.length === 0) {
        container.innerHTML = `<p class="empty-state">Sellistele filtritele ei vasta ükski mäng.</p>`;
        return;
    }

    const stages = groupBy(matches, match => match.stageName);
    const stageNames = Object.keys(stages).sort(compareStages);

    container.innerHTML = stageNames.map(stageName => {
        const stageMatches = stages[stageName].sort((a, b) => a.kickoffDate - b.kickoffDate);
        const byDate = groupBy(stageMatches, match => match.tallinnDateLabel);
        const dateNames = Object.keys(byDate);

        const finishedCount = stageMatches.filter(match => match.status === "FINISHED").length;
        const cardClass = stageName.startsWith("Group") ? "stage-card" : "stage-card knockout";

        return `
            <article class="${cardClass}">
                <div class="card-header">
                    <h3>${escapeHtml(stageName)}</h3>
                    <span>${finishedCount}/${stageMatches.length} lõppenud</span>
                </div>

                ${dateNames.map(dateName => `
                    <div class="day-block">
                        <h4 class="day-title">${escapeHtml(dateName)}</h4>

                        ${byDate[dateName].map(renderMatch).join("")}
                    </div>
                `).join("")}
            </article>
        `;
    }).join("");
}

function renderMatch(match) {
    const badge = getStatusBadge(match);
    const scoreText = match.score
        ? `${match.score.home} - ${match.score.away}`
        : "vs";

    return `
        <div class="match-row">
            <div class="match-topline">
                <span>${escapeHtml(match.round)}</span>
                <span>${badge}</span>
            </div>

            <div class="match-main">
                <strong>${renderTeamLabel(match.team1)}</strong>
                <span class="score-box">${escapeHtml(scoreText)}</span>
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
        return `<span class="status-badge status-finished">FT</span>`;
    }

    if (match.status === "LIVE_ESTIMATE") {
        return `<span class="status-badge status-live">LIVE window · ${escapeHtml(getEstimatedMinute(match.kickoffDate))}</span>`;
    }

    if (match.status === "MISSING_RESULT") {
        return `<span class="status-badge status-missing">Tulemuse ootel</span>`;
    }

    return `<span class="status-badge status-scheduled">Tulemas</span>`;
}

function getEstimatedMinute(kickoffDate) {
    const elapsedMinutes = Math.max(0, Math.floor((new Date() - kickoffDate) / 60000));

    if (elapsedMinutes <= 45) {
        return `~${elapsedMinutes}'`;
    }

    if (elapsedMinutes <= 60) {
        return "HT?";
    }

    if (elapsedMinutes <= 115) {
        return `~${Math.min(90, elapsedMinutes - 15)}'`;
    }

    return "90+'";
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

function getTeamCode(teamName) {
    if (TEAM_CODES[teamName]) {
        return TEAM_CODES[teamName];
    }

    return String(teamName ?? "")
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 3)
        .toUpperCase();
}

function getFlagCode(teamName) {
    return TEAM_FLAGS[teamName] || null;
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

function formatTallinnTime(date) {
    return new Intl.DateTimeFormat("et-EE", {
        timeZone: TALLINN_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
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