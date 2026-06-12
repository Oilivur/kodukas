const DATA_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const TALLINN_TIME_ZONE = "Europe/Tallinn";
const AUTO_REFRESH_MS = 10 * 60 * 1000;

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

    if (showLoading) {
        statusElement.textContent = "Loading World Cup data...";
    }

    try {
        const response = await fetch(`${DATA_URL}?cacheBust=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        allMatches = data.matches
            .map(normalizeMatch)
            .sort((a, b) => a.kickoffDate - b.kickoffDate);

        populateStageFilter();
        renderPage();

        document.getElementById("worldCupUpdated").textContent =
            `Updated: ${formatTallinnDateTime(new Date())}`;

        statusElement.textContent = `Loaded ${allMatches.length} matches from ${data.name}.`;
    } catch (error) {
        console.error(error);
        statusElement.textContent =
            "Could not load World Cup data. The source may be temporarily unavailable.";
    }
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

    select.innerHTML = `<option value="">All groups and stages</option>`;

    stages.forEach(stage => {
        const option = document.createElement("option");
        option.value = stage;
        option.textContent = stage;
        select.appendChild(option);
    });

    select.value = currentValue;
}

function renderPage() {
    const filteredMatches = getFilteredMatches();

    renderSummary(filteredMatches);
    renderStandings(filteredMatches);
    renderMatches(filteredMatches);
}

function getFilteredMatches() {
    const search = document.getElementById("teamSearch").value.trim().toLowerCase();
    const selectedStage = document.getElementById("stageFilter").value;

    return allMatches.filter(match => {
        if (selectedStage && match.stageName !== selectedStage) {
            return false;
        }

        if (!search) {
            return true;
        }

        const searchableText = [
            match.team1,
            match.team2,
            match.stageName,
            match.round,
            match.ground
        ].join(" ").toLowerCase();

        return searchableText.includes(search);
    });
}

function renderSummary(matches) {
    const container = document.getElementById("worldCupSummary");

    const total = matches.length;
    const finished = matches.filter(match => match.status === "FINISHED").length;
    const live = matches.filter(match => match.status === "LIVE_ESTIMATE").length;

    const nextMatch = matches.find(match => {
        return !match.score && match.kickoffDate > new Date();
    });

    container.innerHTML = `
        <div class="summary-card">
            <span>Total games shown</span>
            <strong>${total}</strong>
        </div>

        <div class="summary-card">
            <span>Finished</span>
            <strong>${finished}</strong>
        </div>

        <div class="summary-card">
            <span>Live window</span>
            <strong>${live}</strong>
        </div>

        <div class="summary-card">
            <span>Next game</span>
            <strong>${nextMatch ? `${escapeHtml(nextMatch.team1)} vs ${escapeHtml(nextMatch.team2)}` : "None"}</strong>
        </div>
    `;
}

function renderStandings(matches) {
    const container = document.getElementById("standingsGrid");
    const standings = calculateStandings(matches);

    const groupNames = Object.keys(standings).sort(compareStages);

    if (groupNames.length === 0) {
        container.innerHTML = `<p class="empty-state">No group-stage matches found.</p>`;
        return;
    }

    container.innerHTML = groupNames.map(groupName => {
        const teams = standings[groupName];

        return `
            <article class="standing-card">
                <div class="card-header">
                    <h3>${escapeHtml(groupName)}</h3>
                    <span>${teams.length} teams</span>
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
                                    <span class="rank-pill ${index < 2 ? "qualifies" : ""}">
                                        ${index + 1}
                                    </span>
                                    ${escapeHtml(team.name)}
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
        container.innerHTML = `<p class="empty-state">No matches match the current filter.</p>`;
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
                    <span>${finishedCount}/${stageMatches.length} finished</span>
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
                <strong>${escapeHtml(match.team1)}</strong>
                <span class="score-box">${escapeHtml(scoreText)}</span>
                <strong>${escapeHtml(match.team2)}</strong>
            </div>

            <div class="match-meta">
                <span>${escapeHtml(match.tallinnTimeLabel)} Tallinn time</span>
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
        return `<span class="status-badge status-missing">Result pending</span>`;
    }

    return `<span class="status-badge status-scheduled">Scheduled</span>`;
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
        "Semi-final": 130,
        "Match for third place": 140,
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