let endpointAddress = "https://arrasify.alter-g.workers.dev";
let socketAddress = "wss://arrasify.alter-g.workers.dev";
let homeServer = "https://arrasify.alter-g.workers.dev";

// Localhost Setup
// endpointAddress = "http://127.0.0.1:8787";
// socketAddress = "ws://127.0.0.1:8787";
// homeServer = "http://127.0.0.1:8787";

let bad = [];
let r = await fetch("./bad.jsonc");
if (r.ok) {
    bad = JSON.parse((await r.text()).replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m));
    console.log("Profanity filter loaded.");
};
const swearsRegex = new RegExp(`\\b(${bad.swears.join('|')})\\b`, "gi");
const slursRegex = new RegExp(`\\b(${bad.slurs.join('|')})\\b`, "gi");

let roleDefinitions = [];
r = await fetch(`${endpointAddress}/roles`);
if (r.ok) {
    roleDefinitions = await r.json();
    console.log("Role definitions loaded.");
};

const ws = new WebSocket(`${socketAddress}`);

let settings = {
    // Head toggles
    allow_pings: true,
    dark_theme: true,
    // Option toggles
    show_users: true,
    show_ui: true,
    filter_swears: true,
    filter_slurs: true,
    show_all: false,
    abyss_theme: false,
    night_theme: false,
    aqua_theme: false,
    // Experimental toggles
    allow_mixer: true,
    seasonal_theme: false
};

if (localStorage.getItem("settings")) settings = { ...JSON.parse(localStorage.getItem("settings")) };
else localStorage.setItem("settings", JSON.stringify(settings));

const priority = [ // Priority for roles
    "mlg",
    "testing",
    "flowey",
    "boyfriend",
    "bognis",
    "beta_tester",
    "contributor",
    "top_10",
    "youtuber",
    "supporter",
    "expie",
    "femboy",
    "mysterious",
    "polychrome",
    "est_2027",
    "est_2026",
    "est_2025",
    "est_2024",
    "est_2023",
    "og",
    "deltarune",
    "enthusiast"
];

const priorityMap = new Map(priority.map((name, index) => [name, index]));

let userContextInfo = {
    iID: "-",
    aID: "-"
};

let info = {
    name: "-",
    timeout: 0,
    channel: "???",
    auth: 0,
    aID: "-"
};

let collectedUsers = {
    guests: [],
    users: [],
    helpers: [],
    underseers: [],
    overseers: [],
    admins: [],
    developers: [],
    friends: []
};

let dataUsers = [];

let dragMod = false;
let modLocation = {
    x: 0,
    y: 0
}

let id = ""; // Tells you what account you are. Is also the part after the hashtag of guest usernames
let sessionID = "-"; // Super important. Do NOT give this away, or your account will be temporarily hijacked
let autoScroll = true;
let lastScrollY = 0;
let maximizeUsers = false;

// Text-related things
let messageReplyID = "-"; // - for none
let messageReplyDM = false;

// Upload-related things
let uploadFile = undefined;
let uploadMime = "application/octet-stream";
let uploadSize = 0;
let nextUpload = undefined;
let readyFile = undefined;

// Audio-related things
const pingAudio = new Audio(`${homeServer}/sfx/ping.mp3`);
let canPlayAudio = false;
pingAudio.oncanplay = () => { canPlayAudio = true; };
const importantAudio = new Audio(`${homeServer}/sfx/important.mp3`);
const dmAudio = new Audio(`${homeServer}/sfx/dm.mp3`);
const mixAudio = new Audio();

// Misc
let contextHoldStart = 0;
const contextHoldTimeframe = 1000; // 1 second

const emojis = { // Emoji - ClassList
    "smile": "chat-emoji bi bi-emoji-smile-fill",
    "neutral": "chat-emoji bi bi-emoji-neutral-fill",
    "frown": "chat-emoji bi bi-emoji-frown-fill",
    "angry": "chat-emoji bi bi-emoji-angry-fill",
    "laughing": "chat-emoji bi bi-emoji-laughing-fill",
    "surprise": "chat-emoji bi bi-emoji-surprise-fill",
    "sunglasses": "chat-emoji bi bi-emoji-sunglasses-fill",
    "hearteyes": "chat-emoji bi bi-emoji-heart-eyes-fill",
    "kiss": "chat-emoji bi bi-emoji-kiss-fill",
    "tear": "chat-emoji bi bi-emoji-tear-fill",
    "wink": "chat-emoji bi bi-emoji-wink-fill",
    "astonished": "chat-emoji bi bi-emoji-astonished-fill",
    "dizzy": "chat-emoji bi bi-emoji-dizzy-fill",
    "expressionless": "chat-emoji bi bi-emoji-expressionless-fill"
};

const emotes = { // Emote - SRC
    eDiep: {
        // Diep.io / Arras
        "spectator": "emotes/spectator.png",
        "basic": "emotes/basic.png",
        "youtuber": "emotes/youtuber.png",
        "booster": "emotes/booster.png",
        "ranger": "emotes/ranger.png",
        "tracker3": "emotes/tracker3.png",
        "valrayvn": "emotes/valrayvn.jpg"
    },
    eVerify: {
        // Verify
        "verifyguest": "emotes/verifyguest.png",
        "verifyalt": "emotes/verifyalt.png",
        "verifydirector": "emotes/verifydirector.png",
        "verifytrial": "emotes/verifytrial.png",
        "verifymanager": "emotes/verifymanager.png",
        "verifydev": "emotes/verifydev.png",
        "verifytrash": "emotes/verifytrash.png",
        "verifyyoutuber": "emotes/verifyyoutuber.png",
        "verifymusician": "emotes/verifymusician.png",
        "verifyartist": "emotes/verifyartist.png",
        "verifybongis": "emotes/verifybongis.png",
        "verifyolddev": "emotes/verifyolddev.png"
    },
    eTrust: {
        // Trust
        "extremelynottrust": "emotes/extremelynottrust.png",
        "nottrust": "emotes/nottrust.png",
        "maybetrust": "emotes/maybetrust.png",
        "possiblytrust": "emotes/possiblytrust.png",
        "probablytrust": "emotes/probablytrust.png",
        "yestrust": "emotes/yestrust.png",
        "supertrust": "emotes/supertrust.png",
        "absolutelytrust": "emotes/absolutelytrust.png",
        "eviljinn": "emotes/eviljinn.png",
        "deadchat": "emotes/deadchat.png"
    },
    eDeltarune: {
        // Deltarune
        "mlg": "emotes/mlg.png",
        "ralsei": "emotes/ralsei.png",
        "pansei": "emotes/pansei.jpg",
        "spamton": "emotes/spamton.gif",
        "determination": "emotes/determination.png",
        "jaorange": "emotes/jaorange.png",
        "justice": "emotes/justice.png",
        "kindness": "emotes/kindness.png",
        "patience": "emotes/patience.png",
        "integrity": "emotes/integrity.png",
        "perseverence": "emotes/perseverence.png",
        "wave": "emotes/wave.gif",
        "jevil": "emotes/jevil.gif",
        "gaster": "emotes/gaster.gif",
    },
    eRetro: {
        "bongisalt": "emotes/bongisalt.png",
        "bongisguest": "emotes/bongisguest.png",
        "bongisdirector": "emotes/bongisdirector.png",
        "bongistrial": "emotes/bongistrial.png",
        "bongismanager": "emotes/bongismanager.png",
        "bongisdeveloper": "emotes/bongisdeveloper.png",
        "bongisyoutuber": "emotes/bongisyoutuber.png",
        "bongistrash": "emotes/bongistrash.png",
        "bongisfish": "emotes/bongisfish.png",
    },
    eTTF: {
        // TTF
        "ttfidle": "emotes/ttfidle.gif",
        "ttfseizure": "emotes/ttfseizure.gif",
        "ttfspin": "emotes/ttfspin.gif"
    },
    eChess: {
        "chesscapture": "emotes/chesscapture.png",
        "chessblunder": "emotes/chessblunder.png",
        "chessmistake": "emotes/chessmistake.png",
        "chessdubious": "emotes/chessdubious.png",
        "chessbook": "emotes/chessbook.png",
        "chessgood": "emotes/chessgood.png",
        "chessbrilliant": "emotes/chessbrilliant.png",
        "chessarrow": "emotes/chessarrow.png",
        "chessstar": "emotes/chessstar.png",
        "chessthumb": "emotes/chessthumb.png"
    },
    eGeneral: {
        // General
        "skull": "emotes/skull.png",
        "pepe": "emotes/pepe.png",
        "troll": "emotes/troll.png"
    },
    eMemes: {
        // Memes
        "smart": "emotes/smart.gif",
        "clips": "emotes/clips.gif",
        "bird": "emotes/bird.gif",
        "yippe": "emotes/yippe.gif",
        "nerd": "emotes/nerd.gif",
        "duck": "emotes/duck.gif",
        "bird": "emotes/bird.gif",
        "badapple": "emotes/badapple.gif",
        "idk": "emotes/idk.gif",
        "deadchatskeleton": "emotes/deadchatskeleton.gif",
        "wirewalls": "emotes/wirewalls.gif",
        "clark": "emotes/clark.gif",
        "waaaaat": "emotes/waaaaat.png",
        "concrete_proof": "emotes/concrete_proof.png",
        "thinking": "emotes/thinking.gif",
        "oiia": "emotes/oiia.gif",
        "cat": "emotes/cat.gif",
        "fivefive": "emotes/fivefive.gif",
        "idk2": "emotes/idk2.gif"
    },
    eCommunity: {
        "aperson": "emotes/aperson.jpeg",
        "dkg": "emotes/dkg.png",
        "filament": "emotes/filament.jfif",
        "boykisser": "emotes/boykisser.png",
        "arraspolice": "emotes/arraspolice.gif",
        "chained": "emotes/chained.jpeg",
        "testing": "emotes/testing.jpeg",
        "stipid": "emotes/stipid.jpeg",
        "weather": "emotes/weather.png",
        "crazy": "emotes/crazy.gif",
        "shegendarysquare": "emotes/shegendarysquare.gif",
        "alephnullshegendarysquare": "emotes/alephnullshegendarysquare.gif",
        "spin": "emotes/spin.gif",
        "optical": "emotes/optical.gif",
        "screech": "emotes/screech.jpeg",
        "trauma": "emotes/trauma.png",
        "chess": "emotes/chess.png",
        "no": "emotes/no.png",
        "funkyeye": "emotes/funkyeye.png",
        "heptagons": "emotes/heptagons.png",
        "flarrasio": "emotes/flarrasio.png",
        "skull2": "emotes/skull2.png",
        "iq": "emotes/iq.png",
        "recursion": "emotes/recursion.png",
        "heyapple": "emotes/heyapple.gif",
        "expiebomb": "emotes/expiebomb.png",
        "inglis": "emotes/inglis.png"
    }
};

const allEmotes = { ...emotes.eDiep, ...emotes.eVerify, ...emotes.eTrust, ...emotes.eDeltarune, ...emotes.eRetro, ...emotes.eTTF, ...emotes.eChess, ...emotes.eGeneral, ...emotes.eMemes, ...emotes.eCommunity };

const elements = {
    screen: document.querySelector("#screen"), // The darkening effect
    sheet: document.querySelector("#sheet"), // The style sheet for everything
    // Header Bars
    toggleUsers: document.querySelector("#toggleUsers"), // Toggle the visibility of the user list, whilst making it fullscreen and hiding the chat.
    toggleData: document.querySelector("#toggleData"), // Show the new database UI.
    toggleOptions: document.querySelector("#toggleOptions"), // The element that, when clicked, opens the options.
    toggleDark: document.querySelector("#toggleDark"), // The element that, when clicked, toggles the dark/light theme. Dark by default
    togglePings: document.querySelector("#togglePings"), // Whether pings make a noise or not
    helper: document.querySelector("#helper"),
    altOpenTosPp: document.querySelector("#altOpenTosPp"), // Opens the Terms of Service & Privacy Policy UI
    backToAuth: document.querySelector("#backToAuth"), // Takes the user to the authentication page
    // Authentication
    auth: document.querySelector("#auth"), // The auth page itself
    visitAsGuest: document.querySelector("#visitAsGuest"), // Link button thingy to authenticate as a guest
    barToken: document.querySelector("#barToken"), // The input box you fill when authenticating
    barAuth: document.querySelector("#barAuth"), // The button that, when clicked, authenticates you
    authError: document.querySelector("#authError"), // Any errors that the authentication request has issues with
    // Load Screen
    loading: document.querySelector("#loading"),
    // Main
    main: document.querySelector("main"), // Everything important
    // User-list
    users: document.querySelector("#users"), // A list of online users and friends (it's unlikely you have any though)
    // Chat-related stuff
    viewport: document.querySelector("#viewport"), // The actual chat window itself
    chatInfo: document.querySelector("#chatInfo"), // The status of the chat. Tells you if you're muted or you're affected by slowmode
    chatChannel: document.querySelector("#chatChannel"), // The channel that the chat is currently set to
    chatHistory: document.querySelector("#chatHistory"), // All the past chat messages sent
    chatReply: document.querySelector("#chatReply"), // The reply element
    cancelReply: document.querySelector("#cancelReply"), // Cancels the reply
    replyUser: document.querySelector("#replyUser"), // The user that the reply element contains
    replyContent: document.querySelector("#replyContent"), // The content that the reply element contains
    barMessage: document.querySelector("#barMessage"), // The text to be sent to the chat. Input element
    scrollButton: document.querySelector("#scrollButton"), // Scroll manually to the bottom
    barSend: document.querySelector("#barSend"), // The button that sends the text in #barMessage
    barClip: document.querySelector("#barClip"), // The button that uploads a photo instead of text
    barImage: document.querySelector("#barImage"), // The actual input element that stores the image. Invisible
    barEmote: document.querySelector("#barEmote"), // The button that opens the emote wheel
    emoteList: document.querySelector("#emoteList"), // The emote list itself
    /* Emojis */
    emojiSmile: document.querySelector("#emojiSmile"), // Smile
    emojiNeutral: document.querySelector("#emojiNeutral"), // Neutral
    emojiFrown: document.querySelector("#emojiFrown"), // Frown
    emojiAngry: document.querySelector("#emojiAngry"), // Angry
    emojiLaughing: document.querySelector("#emojiLaughing"), // Laughing
    emojiSurprise: document.querySelector("#emojiSurprise"), // Surprise
    emojiSunglasses: document.querySelector("#emojiSunglasses"), // Sunglasses
    emojiHeartEyes: document.querySelector("#emojiHeartEyes"), // Heart Eyes
    emojiKiss: document.querySelector("#emojiKiss"), // Kiss
    emojiTear: document.querySelector("#emojiTear"), // Tear
    emojiWink: document.querySelector("#emojiWink"), // Wink
    emojiAstonished: document.querySelector("#emojiAstonished"), // Astonished
    emojiDizzy: document.querySelector("#emojiDizzy"), // Dizzy
    emojiExpressionless: document.querySelector("#emojiExpressionless"), // Expressionless
    /* Emotes */
    eDiep: document.querySelector("#eDiep"),
    eVerify: document.querySelector("#eVerify"),
    eTrust: document.querySelector("#eTrust"),
    eDeltarune: document.querySelector("#eDeltarune"),
    eRetro: document.querySelector("#eRetro"),
    eTTF: document.querySelector("#eTTF"),
    eChess: document.querySelector("#eChess"),
    eGeneral: document.querySelector("#eGeneral"),
    eMemes: document.querySelector("#eMemes"),
    eCommunity: document.querySelector("#eCommunity"),
    // Terms of Service & Privacy Policy (TOS-PP)
    tosPp: document.querySelector("#tosPp"), // The Terms of Service & Privacy Policy UI
    openTosPp: document.querySelector("#openTosPp"), // Opens the Terms of Service & Privacy Policy UI
    closeTosPp: document.querySelector("#closeTosPp"), // Dismiss the Terms of Service & Privacy Policy UI
    // Upload Confirmation
    imageConfirm: document.querySelector("#imageConfirm"), // The image confirm ui container
    imageConfirmImage: document.querySelector("#imageConfirmImage"), // The image confirm preview image
    imageConfirmVideo: document.querySelector("#imageConfirmVideo"), // The image confirm preview video
    imageConfirmVideoSource: document.querySelector("#imageConfirmVideoSource"), // The image confirm preview video source
    imageConfirmAudio: document.querySelector("#imageConfirmAudio"), // The image confirm preview audio
    imageConfirmError: document.querySelector("#imageConfirmError"), // The image confirm error
    imageConfirmY: document.querySelector("#imageConfirmY"), // Image confirm yes button
    imageConfirmN: document.querySelector("#imageConfirmN"), // Image confirm no button
    // Media Enlarger
    imageEnlarger: document.querySelector("#imageEnlarger"), // The ui element containing the enlarged element
    imageEnlargerFocus: document.querySelector("#imageEnlargerFocus"), // The actual image to be enlarged
    imageEnlargerClose: document.querySelector("#imageEnlargerClose"), // The button to dismiss the enlarged image
    // The Book
    // Tabs
    book: document.querySelector("#book"),
    closeBook: document.querySelector("#closeBook"),
    bookAbout: document.querySelector("#bookAbout"),
    bookRules: document.querySelector("#bookRules"),
    bookChangelog: document.querySelector("#bookChangelog"),
    bookAdmins: document.querySelector("#bookAdmins"),
    bookSupport: document.querySelector("#bookSupport"),
    bookCommands: document.querySelector("#bookCommands"),
    bookCredits: document.querySelector("#bookCredits"),
    // Content
    bookAboutContent: document.querySelector("#bookAboutContent"),
    bookRulesContent: document.querySelector("#bookRulesContent"),
    bookChangelogContent: document.querySelector("#bookChangelogContent"),
    bookAdminsContent: document.querySelector("#bookAdminsContent"),
    bookSupportContent: document.querySelector("#bookSupportContent"),
    bookCommandsContent: document.querySelector("#bookCommandsContent"),
    bookCreditsContent: document.querySelector("#bookCreditsContent"),
    // Options
    options: document.querySelector("#options"), // The options menu.
    optionsClose: document.querySelector("#optionsClose"), // The close options menu button.
    optionsViewUser: document.querySelector("#viewUser"), // Toggle the viewing of the user list.
    optionsViewUI: document.querySelector("#viewUI"), // Toggle the viewing of the new UI.
    optionsViewSwears: document.querySelector("#viewSwears"), // Toggle the filtering of swears.
    optionsViewSlurs: document.querySelector("#viewSlurs"), // Toggle the filtering of slurs.
    optionsShowAll: document.querySelector("#showAll"), // Toggle the filtering of accounts you have created.
    optionsTAbyss: document.querySelector("#tAbyss"), // Toggle the Abyss theme. Overrides the current theme.
    optionsTNight: document.querySelector("#tNight"), // Toggle the Night theme. Overrides the current theme and any before.
    optionsTAqua: document.querySelector("#tAqua"), // Toggle the Aqua theme. Overrides the current theme and any before.
    optionsExpMixer: document.querySelector("#expMixer"), // Toggle the hearing of the mixer.
    optionsExpSeasonalTheme: document.querySelector("#expSeasonalTheme"), // Toggle the Seasonal Theme if there is one.
    door: document.querySelector("#door"), // Door
    // Data
    data: document.querySelector("#data"), // Database Management
    closeData: document.querySelector("#closeData"), // Close button for database management
    dataSearch: document.querySelector("#dataSearch"), // Search for specific users
    dataRefresh: document.querySelector("#dataRefresh"), // Refresh the users list data
    dataTableBody: document.querySelector("#dataTableBody"), // Where users get added
    // Profile
    closeProfile: document.querySelector("#closeProfile"),
    profile: document.querySelector("#profile"),
    // Profile Actions
    profileActionMod: document.querySelector("#profileActionMod"),
    profileActionMessage: document.querySelector("#profileActionMessage"),
    profileActionBlock: document.querySelector("#profileActionBlock"),
    // Profile Data
    profilePfp: document.querySelector("#profilePfp"),
    profileName: document.querySelector("#profileName"),
    profileRoles: document.querySelector("#profileRoles"),
    profileBio: document.querySelector("#profileBio"),
    // Context
    userContext: document.querySelector("#userContext"),
    userContextKick: document.querySelector("#userContextKick"),
    userContextCopyIID: document.querySelector("#userContextCopyIID"),
    userContextCopyAID: document.querySelector("#userContextCopyAID"),
    userContextCancel: document.querySelector("#userContextCancel"),
    // Mod
    mod: document.querySelector("#mod"),
    modHeader: document.querySelector("#modHeader"),
    // Disconnection Screen
    disconnect: document.querySelector("#disconnect"),
    disconnectReason: document.querySelector("#disconnectReason"),
    disconnectCode: document.querySelector("#disconnectCode"),
    // Toasts
    toasts: document.querySelector("#toasts"),
};

// Load settings
if (settings.allow_pings) elements.togglePings.className = "bi bi-bell header-icons";
else elements.togglePings.className = "bi bi-bell-slash header-icons";
if (settings.show_ui) elements.sheet.href = "overhaul.css";
else elements.sheet.href = "style.css";
if (settings.dark_theme) {
    elements.toggleDark.className = "bi bi-moon-stars-fill header-icons";
    if (!settings.seasonal_theme) {
        document.body.classList.remove("theme-light");
        document.body.classList.add("theme-dark");
    } else {
        document.body.classList.remove("theme-seasonal-light");
        document.body.classList.add("theme-seasonal-dark");
    }
} else {
    elements.toggleDark.className = "bi bi-sun-fill header-icons";
    if (!settings.seasonal_theme) {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
    } else {
        document.body.classList.remove("theme-seasonal-dark");
        document.body.classList.add("theme-seasonal-light");
    }
};
if (settings.show_users) {
    elements.optionsViewUser.className = "bi bi-toggle-on";
} else {
    elements.optionsViewUser.className = "bi bi-toggle-off";
};
if (settings.show_ui) {
    elements.optionsViewUI.className = "bi bi-toggle-on";
    if (settings.show_users) elements.viewport.style.width = "80%";
    else elements.viewport.style.width = "100%";
} else {
    elements.optionsViewUI.className = "bi bi-toggle-off";
    if (settings.show_users) elements.viewport.style.width = "60%";
    else elements.viewport.style.width = "80%";
};
if (settings.filter_swears) {
    elements.optionsViewSwears.className = "bi bi-toggle-on";
} else {
    elements.optionsViewSwears.className = "bi bi-toggle-off";
};
if (settings.filter_slurs) {
    elements.optionsViewSlurs.className = "bi bi-toggle-on";
} else {
    elements.optionsViewSlurs.className = "bi bi-toggle-off";
};
if (settings.show_all) {
    elements.optionsShowAll.className = "bi bi-toggle-on";
} else {
    elements.optionsShowAll.className = "bi bi-toggle-off";
};
if (settings.abyss_theme) {
    elements.optionsTAbyss.className = "bi bi-toggle-on";
    document.body.classList.add("theme-abyss");
} else {
    elements.optionsTAbyss.className = "bi bi-toggle-off";
    document.body.classList.remove("theme-abyss");
};
if (settings.night_theme) {
    elements.optionsTNight.className = "bi bi-toggle-on";
    document.body.classList.add("theme-night");
} else {
    elements.optionsTNight.className = "bi bi-toggle-off";
    document.body.classList.remove("theme-night");
};
if (settings.aqua_theme) {
    elements.optionsTAqua.className = "bi bi-toggle-on";
    document.body.classList.add("theme-aqua");
} else {
    elements.optionsTAqua.className = "bi bi-toggle-off";
    document.body.classList.remove("theme-aqua");
};
if (settings.allow_mixer) {
    elements.optionsExpMixer.className = "bi bi-toggle-on";
} else {
    elements.optionsExpMixer.className = "bi bi-toggle-off";
};
if (settings.seasonal_theme) {
    elements.optionsExpSeasonalTheme.className = "bi bi-toggle-on";
} else {
    elements.optionsExpSeasonalTheme.className = "bi bi-toggle-off";
};

const createToast = (text) => {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<p>${text}</p>`;
    const dissipation = () => {
        toast.classList.add("toast-dissipate");
        setTimeout(() => { toast.remove(); }, 1000);
    };
    setTimeout(() => dissipation(), 3000);
    elements.toasts.appendChild(toast);
};

const scrollChatHistory = () => {
    elements.barMessage.focus();
    elements.chatHistory.scrollTop = elements.chatHistory.scrollHeight;
};

const refreshData = () => {
    elements.dataSearch.value = "";
    elements.dataTableBody.innerHTML = `<tr>
            <td><p>Fetching. Please wait...</p></td>
        </tr>`;
    const response = fetch(`${endpointAddress}/data`, {
        headers: {
            "Authorization": sessionID,
        }
    }).then(async (r) => {
        if (!r.ok) {
            elements.dataTableBody.innerHTML = `<tr>
                <td><p>Couldn't fetch users.<br>Reason: "${r.statusText}"<br>Code: ${r.status}</p></td>
            </tr>`;
        } else {
            let data = await r.json();
            data = data.map((str) => JSON.parse(str));
            dataUsers = data;
            showDataUsers("auth");
        };
    }).catch((e) => {
        elements.dataTableBody.innerHTML = `<tr>
            <td><p>An unexpected error occured. Please try again later.</p></td>
        </tr>`;
        console.error(e);
    });
};

const messageCreateUserBio = (user, pfp, roles, bio) => {
    elements.profile.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
    elements.profileName.innerText = user;
    elements.profilePfp.src = pfp;
    elements.profileRoles.innerHTML = ``;
    if (!roles || roles === "" || roles.split("|").length < 1) elements.profileRoles.innerHTML += `<li class="profile-role" style="list-style-type: none;"><p><span class="profile-role-blank" style="background-color: var(--white-color);"></span>No roles.</p></li>`;
    else {
        var separateRoles = roles.split("|");
        separateRoles.sort((a, b) => {
            const nameA = a.split("?").length > 1 ? a.split("?")[0] : a;
            const nameB = b.split("?").length > 1 ? b.split("?")[0] : b;

            const indexA = priorityMap.has(nameA) ? priorityMap.get(nameA) : Infinity;
            const indexB = priorityMap.has(nameB) ? priorityMap.get(nameB) : Infinity;
            return indexA - indexB;
        });
        separateRoles.forEach(role => {
            const processed = role.split("?");
            const roleID = processed.shift();
            const basis = roleDefinitions.find(r => r.id === roleID);
            const displayRole = document.createElement("li");
            displayRole.innerText = basis.name;
            displayRole.style.listStyleType = "none";
            displayRole.classList.add("profile-role");
            let vars = {};
            if (processed.length > 0) {
                processed.shift().split("&").forEach(v => {
                    vars[v.split("=")[0]] = v.split("=")[1];
                });
            };
            switch (roleID) {
                case "youtuber": {
                    if (basis.icon.type === "image") {
                        displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><a href="https://www.youtube.com/${vars.channel}" class="message-youtuber">${basis.name}</a>`;
                    };
                    break;
                } case "polychrome": {
                    if (basis.icon.type === "image") {
                        displayRole.innerHTML = displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p></p>`;
                        for (let i = 0; i < basis.name.length; i++) {
                            const letter = basis.name[i];
                            const l = document.createElement("b");
                            l.innerText = letter;
                            l.style.animation = `ease-in-out 1s animRainbow infinite`;
                            l.style.animationDelay = `-${(i % 16) * 1000 / 16}ms`;
                            displayRole.children.item(1).appendChild(l);
                        };
                    };
                    break;
                } case "femboy": {
                    displayRole.innerHTML = `<p class="message-${basis.id}"><span class="profile-role-blank" style="background-color: ${basis.icon.color};"></span>${basis.name}</p>`;
                    break;
                };
                case "mysterious":
                case "expie": {
                    displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p class="message-${basis.id}">${basis.name}</p>`;
                    break;
                } case "boyfriend": {
                    displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p class="message-purple">${basis.name}</p>`;
                    break;
                } case "mlg": {
                    displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p class="message-dark">${basis.name}</p>`;
                    break;
                } case "beta_tester": {
                    displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p class="message-aqua">${basis.name}</p>`;
                    break;
                } case "testing": {
                    displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p class="message-dark">${basis.name}</p>`;
                    break;
                } default: {
                    if (basis.icon.type === "image") {
                        displayRole.innerHTML = `<img class="profile-role-icon" src="${homeServer}/${basis.icon.src}"><p>${basis.name}</p>`;
                    };
                    if (basis.icon.type === "solid") {
                        displayRole.innerHTML = `<p><span class="profile-role-blank" style="background-color: ${basis.icon.color};"></span>${basis.name}</p>`;
                    };
                };
            };
            elements.profileRoles.appendChild(displayRole);
        });
    };
    elements.profileBio.innerHTML = "";
    if (!bio || bio == "" || bio == " ") elements.profileBio.insertAdjacentHTML("beforeend", `<p>No bio provided.</p>`);
    else {
        let lines = bio.split(/\r?\n|\\n/);
        lines.forEach((line) => {
            const p = document.createElement("p");
            if (settings.filter_swears) line = line.replace(swearsRegex, (m) => "*".repeat(m.length));;
            if (settings.filter_slurs) line = line.replace(slursRegex, (m) => "*".repeat(m.length));
            p.innerText = `${line}`;
            elements.profileBio.appendChild(p);
            // elements.profileBio.insertAdjacentHTML("beforeend", `<p>${line}</p>`);
        });
    };
}

const messageCreateUserElement = (user, auth, pfp, roles, bio, verified, neo, timestamp, message, iID, aID, id, dm, canReply) => {
    // User Info
    const chatUser = document.createElement("div"); // Includes the sender information, as well as buttons and the date/time of postage
    chatUser.className = "chat-user";
    const userInfo = document.createElement("div"); // Contains only the user's name, pfp, badges, and verification status
    userInfo.className = "user-info";

    // Sort out the user name, pfp and verification symbol.
    let userPfp = undefined;
    if (pfp && aID != "!") {
        userPfp = document.createElement("img");
        userPfp.src = pfp;
        userPfp.className = "user-pfp";
    } else if (!pfp && aID == "!") { // The pfp used for bots
        const svgNS = "http://www.w3.org/2000/svg";
        userPfp = document.createElementNS(svgNS, "svg");
        userPfp.setAttribute("class", "user-pfp");
        userPfp.setAttribute("width", "100");
        userPfp.setAttribute("height", "100");
        userPfp.setAttribute("viewBox", "0 0 100 100");
        userPfp.innerHTML = `
            <rect class="message-rainbow" xmlns=${svgNS} width="100" height="100" />
            <circle xmlns=${svgNS} cx="50" cy="50" r="43" fill="var(--primary-color)" />
            <circle class="message-rainbow" xmlns=${svgNS} cx="35" cy="45" r="7" />
            <circle class="message-rainbow" xmlns=${svgNS} cx="65" cy="45" r="7" />
            <rect class="message-rainbow" xmlns=${svgNS} x="30" y="60" width="40" height="10" />
            <rect xmlns=${svgNS} x="35.25" y="55" width="5" height="20" fill="var(--primary-color)" />
            <rect xmlns=${svgNS} x="47.5" y="55" width="5" height="20" fill="var(--primary-color)" />
            <rect xmlns=${svgNS} x="59.75" y="55" width="5" height="20" fill="var(--primary-color)" />
        `;
    } else { // The default pfp when none is selected or its an invalid pfp
        const svgNS = "http://www.w3.org/2000/svg";
        userPfp = document.createElementNS(svgNS, "svg");
        userPfp.setAttribute("class", "user-pfp");
        userPfp.setAttribute("width", "100");
        userPfp.setAttribute("height", "100");
        userPfp.setAttribute("viewBox", "0 0 100 100");
        userPfp.innerHTML = `
            <rect xmlns=${svgNS} width="100" height="100" fill="var(--primary-color)" />
            <circle xmlns=${svgNS} cx="50" cy="100" r="50" fill="var(--accent-color)" />
            <circle xmlns=${svgNS} cx="50" cy="55" r="30" fill="var(--primary-color)" />
            <circle xmlns=${svgNS} cx="50" cy="45" r="25" fill="var(--accent-color)" />
        `;
    };

    const userName = document.createElement("p");
    if (!["shake", "hyperneo", "polychrome"].includes(neo)) {
        userName.innerText = `${dm ? "[Direct] " : ""}${user}`;
        userName.className = `user-name message-${neo}`;
    } else {
        switch (neo) {
            case "polychrome": {
                userName.className = `user-name`;
                const content = `${dm ? "[Direct] " : ""}${user}`;
                for (let i = 0; i < content.length; i++) {
                    const letter = content[i];
                    const s = document.createElement("b");
                    s.style.animation = `ease-in-out 1s animRainbow infinite`;
                    s.style.animationDelay = `-${(i % 16) * 1000 / 16}ms`;
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
            case "hyperneo": {
                userName.className = `user-name`;
                const content = `${dm ? "[Direct] " : ""}${user}`;
                for (let i = 0; i < content.length; i++) {
                    const letter = content[i];
                    const s = document.createElement("b");
                    s.style.animation = `ease-in-out 2s animHyperneo infinite`;
                    s.style.animationDelay = `-${(i % 8) * 1000 / 8}ms`;
                    s.style.position = "relative";
                    s.style.marginInlineEnd = "8px";
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
            case "shake": {
                userName.className = `user-name`;
                const content = `${dm ? "[Direct] " : ""}${user}`;
                for (let i = 0; i < content.length; i++) {
                    const letter = content[i];
                    const s = document.createElement("b");
                    s.style.animation = `linear 0.5s animShake infinite`;
                    s.style.animationDelay = `-${Math.floor(Math.random() * (1000) + 1)}ms`;
                    s.style.position = "relative";
                    s.style.marginInlineEnd = "8px";
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
        };
    };
    userInfo.appendChild(userPfp);
    userInfo.appendChild(userName);
    switch (auth) {
        case 2: {
            let userBadge = document.createElement("img");
            userBadge.className = "user-badge";
            userBadge.src = `${homeServer}/badges/helper.png`;
            userInfo.appendChild(userBadge);
            break;
        };
        case 3: {
            let userBadge = document.createElement("img");
            userBadge.className = "user-badge";
            userBadge.src = `${homeServer}/badges/underseer.png`;
            userInfo.appendChild(userBadge);
            break;
        };
        case 4: {
            let userBadge = document.createElement("img");
            userBadge.className = "user-badge";
            userBadge.src = `${homeServer}/badges/overseer.png`;
            userInfo.appendChild(userBadge);
            break;
        };
        case 5: {
            let userBadge = document.createElement("img");
            userBadge.className = "user-badge";
            userBadge.src = `${homeServer}/badges/admin.png`;
            userInfo.appendChild(userBadge);
            break;
        };
        case 6: {
            let userBadge = document.createElement("img");
            userBadge.className = "user-badge";
            userBadge.src = `${homeServer}/badges/developer.png`;
            userInfo.appendChild(userBadge);
            break;
        };
    };
    if (verified) {
        let verifiedSymbol = document.createElement("i");
        verifiedSymbol.className = "bi bi-check-circle user-verified";
        userInfo.appendChild(verifiedSymbol);
    };
    const openContext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.userContext.classList.remove("hidden");
        if (info.auth > 4) elements.userContextKick.classList.remove("hidden");
        else elements.userContextKick.classList.add("hidden");
        elements.userContext.style.top = e.pageY + "px";
        elements.userContext.style.left = e.pageX + "px";
        userContextInfo = {
            iID,
            aID
        };
    }
    userInfo.ontouchstart = (e) => {
        contextHoldStart = Date.now();
    };
    userInfo.onclick = (e) => {
        if (Date.now() - contextHoldStart > contextHoldTimeframe && contextHoldStart !== 0) openContext(e);
        else {
            if (aID == "-" || aID == "!") {
                createToast("You can't view this profile.");
            } else { // Invalid profiles do not have pfps
                messageCreateUserBio(user, pfp, roles, bio);
                elements.profileActionMod.onclick = (e) => {
                    createToast(`This feature is unavailable.`);
                };
                elements.profileActionMessage.onclick = (e) => {
                    createToast(`This feature is unavailable.`);
                };
                elements.profileActionBlock.onclick = (e) => {
                    // ws.send(JSON.stringify({
                    //     type: "text",
                    //     content: `/block add ${aID}`
                    // }));
                    createToast(`This feature is unavailable.`);
                };
            };
        };
        contextHoldStart = 0;
    };
    userInfo.oncontextmenu = (e) => {
        openContext(e);
    };
    userInfo.oncontextlost = (e) => {
        elements.userContext.classList.add("hidden");
    };

    // Extra buttons and timestamp
    const time = document.createElement("p");
    let dateTime = new Date(timestamp);
    time.innerText = `${dateTime.getHours() < 10 ? "0" : ""}${(dateTime.getHours() == 12 || dateTime.getHours() == 0) ? "12" : dateTime.getHours() % 12}:${dateTime.getMinutes() < 10 ? "0" : ""}${dateTime.getMinutes()} ${dateTime.getHours() < 12 ? "AM" : "PM"}`;

    const messageActions = document.createElement("div");
    messageActions.className = "message-actions";
    if (canReply) {
        const messageActionReply = document.createElement("i");
        messageActionReply.className = "bi bi-reply-fill";
        messageActionReply.onclick = () => eInitiateReply(user, message, id, dm);
        messageActions.appendChild(messageActionReply);
    }
    //const messageActionDelete = document.createElement("i");
    //messageActionDelete.className = "bi bi-trash";
    //messageActions.appendChild(messageActionDelete);

    chatUser.appendChild(userInfo);
    chatUser.appendChild(time);
    if (canReply) chatUser.appendChild(messageActions);
    return chatUser;
};

const messageCreateTextElement = (message, color, auth) => {
    // Text
    const chatMessage = document.createElement("div");
    if (!["shake", "hyperneo", "polychrome"].includes(color)) {
        chatMessage.className = `chat-message message-${color}`;
    } else {
        chatMessage.clasName = `chat-message`;
    };
    const p = document.createElement("p");
    p.className = "chat-message-lines";
    // Message Paragraphs
    let lines = message.toString();
    lines = lines.split(/\r?\n|\\n/);
    const paragraphs = [];
    lines.forEach(line => { // Per paragraph
        let s = document.createElement("span"); // This used to be p
        s.className = "chat-message-line";
        // Split emotes
        // let reconstructed = [];
        // let previousWasEmote = false;
        // const emoteSplit = line.split(":");
        // // Initial text
        // // reconstructed.push(emoteSplit[0]);
        // const pElement = document.createElement(`p`);
        // pElement.textContent = emoteSplit[0];
        // s.appendChild(pElement);
        // for (let i = 1; i < emoteSplit.length; i++) { // Per emote
        //     // Check if it's an emoji
        //     if (Object.keys(emojis).includes(emoteSplit[i])) {
        //         previousWasEmote = true;
        //         // reconstructed.push(`<i class="${emojis[emoteSplit[i]]}"></i>`);
        //         const emojiElement = document.createElement(`i`);
        //         emojiElement.className = `${emojis[emoteSplit[i]]}`;
        //         s.appendChild(emojiElement);
        //     } else if (Object.keys(allEmotes).includes(emoteSplit[i])) { // Check if it's an emote
        //         previousWasEmote = true;
        //         // reconstructed.push(`<img class="chat-emote" src="${emotes[emoteSplit[i]]}">`);
        //         const emoteElement = document.createElement(`img`);
        //         emoteElement.className = `chat-emote`;
        //         emoteElement.src = `${allEmotes[emoteSplit[i]]}`;
        //         s.appendChild(emoteElement);
        //     } else if (i > 0 && !previousWasEmote) {
        //         previousWasEmote = false;
        //         // reconstructed.push(":" + emoteSplit[i]);
        //         const pElement = document.createElement(`p`);
        //         pElement.textContent = ":" + emoteSplit[i];
        //         if (emoteSplit[i - 1][emoteSplit[i - 1].length - 1] === " ") pElement.style.marginLeft = `4px`;
        //         s.appendChild(pElement);
        //     } else {
        //         previousWasEmote = false;
        //         // reconstructed.push(emoteSplit[i]);
        //         const pElement = document.createElement(`p`);
        //         pElement.textContent = emoteSplit[i];
        //         s.appendChild(pElement);
        //     };
        //     // p.appendChild(s);
        // };
        const escapeHTML = (str) => {
            return str
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
        };
        const p = document.createElement("p");
        p.textContent = escapeHTML(line);
        s.appendChild(p);
        // s.innerText = line;
        // Pings
        const pingable = [
            ...collectedUsers.guests,
            ...collectedUsers.users,
            ...collectedUsers.helpers,
            ...collectedUsers.underseers,
            ...collectedUsers.overseers,
            ...collectedUsers.admins,
            ...collectedUsers.developers
        ].map(user => user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        if (auth > 4) {
            pingable.push("everyone");
            pingable.push("developers");
        }
        if (auth > 3) pingable.push("admins");
        if (auth > 2) pingable.push("overseers");
        if (auth > 1) pingable.push("underseers");
        if (auth > 0) pingable.push("helpers");
        let regExPing = new RegExp(`(@${pingable.join("|@")})`, "g");
        // for (let i = 0; i < s.children.length; i++) {
        //     if (s.children[i].tagName === "P") {
        // Emotes
        let html = s.children.item(0).innerText.replace(/:([^:\s]+):/g, (match, key) => {
            return allEmotes[key] ?
                `</p><img class="chat-emote" src="${homeServer}/${allEmotes[key]}"><p>` :
                emojis[key] ?
                    `</p><i class="${emojis[key]}"></i><p>` : match;
        });
        // Formatting / Markdown
        // Bold Italic
        html = html.replace(/\*{3}(.+?)\*{3}/g, "<b><i>$1</i></b>");
        // Bold
        html = html.replace(/\*{2}(.+?)\*{2}/g, "<b>$1</b>");
        // Italic
        html = html.replace(/\*(.+?)\*/g, "<i>$1</i>");
        // Strikethrough
        html = html.replace(/\~{2}(.+?)\~{2}/g, "<s>$1</s>");
        // Underline
        html = html.replace(/\_{2}(.+?)\_{2}/g, "<u>$1</u>");
        // Code
        html = html.replace(/\`(.+?)\`/g, "<code>$1</code>");
        // Header
        // html = html.replace(/\#(.+?)\#/g, "<h1>$1</h1>");
        // Spoiler
        html = html.replace(/\|{2}(.+?)\|{2}/g, "<details><summary>Click to expand or collapse.</summary><p>$1</p></details>");
        // if (auth > 5) {};
        // Pings
        if (html.includes(`@${info.name}`)) {
            if (canPlayAudio && settings.allow_pings) { pingAudio.play(); };
        } else if (auth > 4 && html.includes(`@everyone`) && canPlayAudio && settings.allow_pings) { importantAudio.play(); }
        else if (auth > 4 && html.includes(`@developers`) && canPlayAudio && settings.allow_pings && info.auth === 6) { importantAudio.play(); }
        else if (auth > 3 && html.includes(`@admins`) && canPlayAudio && settings.allow_pings && info.auth === 5) { importantAudio.play(); }
        else if (auth > 2 && html.includes(`@overseers`) && canPlayAudio && settings.allow_pings && info.auth === 4) { importantAudio.play(); }
        else if (auth > 1 && html.includes(`@underseers`) && canPlayAudio && settings.allow_pings && info.auth === 3) { importantAudio.play(); }
        else if (auth > 0 && html.includes(`@helpers`) && canPlayAudio && settings.allow_pings && info.auth === 2) { importantAudio.play(); };
        html = html.replace(regExPing, `<span class="message-ping">\$1</span>`);
        // Filters
        if (settings.filter_slurs) html = html.replace(slursRegex, (m) => "*".repeat(m.length));
        if (settings.filter_swears) html = html.replace(swearsRegex, (m) => "*".repeat(m.length));
        //    };
        // };
        // p.innerHTML = reconstructed.join("");
        // paragraphs.push(p);
        s.children.item(0).innerHTML = html;
        console.log(s.children.item(0).innerHTML);
        // This removes empty P elements
        if (s.children.item(0).children.length > 0) {
            for (let x = 0; x < s.children.item(0).children.length; x++) {
                const e = s.children.item(0).children.item(x);
                if (e.tagName === "P" && e.innerText === "") s.children.item(0).removeChild(e);
            };
        };
        // This removes the wrapped P element
        if (s.children.item(0).children.length > 0) {
            for (let x = 0; x < s.children.item(0).children.length; x++) {
                const e = s.children.item(0).children.item(x);
                if (e.tagName === "IMG") {
                    s.innerHTML = s.children.item(0).innerHTML;
                    break;
                };
            };
        };
        for (let i = 0; i < s.children.length; i++) {
            if (!["IMG", "I"].includes(s.children.item(i).tagName)) {
                // s.children.item(i).innerText === "" && !["IMG", "I"].includes(s.children.item(i).children.item(x).tagName) ? s.removeChild(s.children.item(i)) : null;
                if (["shake", "hyperneo", "polychrome"].includes(color)) {
                    switch (color) {
                        case "polychrome": {
                            const content = s.children.item(i).innerText;
                            s.children.item(i).innerText = "";
                            for (let x = 0; x < content.length; x++) {
                                const letter = content[x];
                                const l = document.createElement("b");
                                l.style.animation = `ease-in-out 1s animRainbow infinite`;
                                l.style.animationDelay = `-${(x % 16) * (1000 / 16)}ms`;
                                if (letter !== " ") l.style.marginInlineEnd = "0px";
                                l.innerText = letter;
                                s.children.item(i).appendChild(l);
                            };
                            break;
                        };
                        case "hyperneo": {
                            const content = s.children.item(i).innerText;
                            s.children.item(i).innerText = "";
                            for (let x = 0; x < content.length; x++) {
                                const letter = content[x];
                                const l = document.createElement("b");
                                l.style.animation = `ease-in-out 2s animHyperneo infinite`;
                                l.style.animationDelay = `-${(x % 8) * 1000 / 8}ms`;
                                l.style.position = "relative";
                                l.style.marginInlineEnd = "8px";
                                l.innerText = letter;
                                s.children.item(i).appendChild(l);
                            };
                            break;
                        };
                        case "shake": {
                            const content = s.children.item(i).innerText;
                            s.children.item(i).innerText = "";
                            for (let x = 0; x < content.length; x++) {
                                const letter = content[x];
                                const l = document.createElement("b");
                                l.style.animation = `linear 0.5s animShake infinite`;
                                l.style.animationDelay = `-${Math.floor(Math.random() * (1000) + 1)}ms`;
                                l.style.position = "relative";
                                l.style.marginInlineEnd = "8px";
                                l.innerText = letter;
                                s.children.item(i).appendChild(l);
                            };
                            break;
                        };
                    };
                };
            };
        };
        if (s.children.length > 0) {
            if (s.children.item(0).tagName === "IMG" && s.children.length < 2 && s.innerText === "") {
                // s.children.item(0).style.width = "100px";
                // s.children.item(0).style.height = "100px";
                s.children.item(0).classList.add("big-emote");
            } else if (s.children.item(0).tagName === "I" && s.children.length < 2) {
                s.children.item(0).classList.add("big-emoji");
                // s.children.item(0).style.fontSize = `${parseFloat(window.getComputedStyle(s.children[0]).fontSize)}px`;
            };
            // } else {
            //     if (s.children.item(0).innerText === "") s.removeChild(s.children.item(0));
            //     if (s.children.item(s.children.length - 1).innerText === "") s.removeChild(s.children.item(s.children.length - 1));
            // };
        };
        paragraphs.push(s);
    });
    paragraphs.forEach(pgs => {
        // chatMessage.appendChild(pgs);
        p.appendChild(pgs);
    });
    chatMessage.appendChild(p);
    return chatMessage;
};

const messageCreateImageElement = (file) => {
    const chatMessage = document.createElement("div");
    chatMessage.className = `chat-message`;
    let imageElement = document.createElement("img");
    imageElement.className = "chat-image";
    let fileUrl = URL.createObjectURL(file);
    imageElement.src = fileUrl;
    imageElement.style.cursor = "pointer";
    imageElement.onclick = () => {
        elements.imageEnlargerFocus.src = fileUrl;
        elements.screen.classList.remove("hidden");
        elements.imageEnlarger.classList.remove("hidden");
    };
    chatMessage.appendChild(imageElement);
    return chatMessage;
};

const messageCreateAudioElement = (file) => {
    const chatMessage = document.createElement("div");
    chatMessage.className = `chat-message`;
    let audioElement = document.createElement("audio");
    audioElement.className = "chat-audio";
    let fileUrl = URL.createObjectURL(file);
    audioElement.src = fileUrl;
    audioElement.setAttribute("controls", true);
    chatMessage.appendChild(audioElement);
    return chatMessage;
};

const messageCreateVideoElement = (file) => {
    const chatMessage = document.createElement("div");
    chatMessage.className = `chat-message`;
    let videoElement = document.createElement("video");
    videoElement.className = "chat-video";
    let fileUrl = URL.createObjectURL(file);
    videoElement.src = fileUrl;
    videoElement.setAttribute("controls", true);
    chatMessage.appendChild(videoElement);
    return chatMessage;
};

const createMessageText = (user, auth, pfp, roles, bio, verified, message, neo, color, timestamp, iID, aID, id, reply, dm, canReply) => {
    if (message.toString() != "") {
        const messageElement = document.createElement("div");
        messageElement.className = `message${dm ? " dm" : ""}`;

        const replyText = document.createElement("p");
        replyText.className = "reply-text";
        if (reply != "-") {
            if (settings.filter_slurs) reply = reply.replace(slursRegex, (m) => "*".repeat(m.length));
            if (settings.filter_swears) reply = reply.replace(swearsRegex, (m) => "*".repeat(m.length));
            replyText.innerText = reply;
        };

        const chatUser = messageCreateUserElement(user, auth, pfp, roles, bio, verified, neo, timestamp, message, iID, aID, id, dm, canReply);
        // chatUser.querySelector(".bi-trash").onclick = () => messageElement.remove();
        const chatMessage = messageCreateTextElement(message, color, auth);

        if (reply != "-") messageElement.appendChild(replyText);
        messageElement.appendChild(chatUser);
        // HR element to separate the sender from the message content
        messageElement.appendChild(document.createElement("hr"));
        messageElement.appendChild(chatMessage);

        elements.chatHistory.appendChild(messageElement);
        if (autoScroll) setTimeout(scrollChatHistory, 30);
        if (settings.allow_pings && dm) dmAudio.play();
    };
}

const createMessageUpload = (user, auth, pfp, roles, bio, verified, file, mime, neo, timestamp, iID, aID, id) => {
    const messageElement = document.createElement("div");
    messageElement.className = "message";

    // const replyText = document.createElement("p");
    // replyText.className = "reply-text";
    // if (reply != "-") replyText.innerText = reply;

    const chatUser = messageCreateUserElement(user, auth, pfp, roles, bio, verified, neo, timestamp, "[Upload]", iID, aID, id, false, true);
    let chatMedia = undefined;
    // chatUser.querySelector(".bi-trash").onclick = () => messageElement.remove();
    switch (mime.split("/")[0]) {
        case "image":
            chatMedia = messageCreateImageElement(file);
            break;
        case "audio":
            chatMedia = messageCreateAudioElement(file);
            break;
        case "video":
            chatMedia = messageCreateVideoElement(file);
            break;
        default:
            chatMedia = document.createElement("div");
            chatMedia.className = "chat-message";
            const p = document.createElement("p");
            p.innerText = `[Unknown upload].`;
            chatMedia.appendChild(p);
            break;
    };

    messageElement.appendChild(chatUser);
    // HR element to separate the sender from the message content
    messageElement.appendChild(document.createElement("hr"));
    messageElement.appendChild(chatMedia);

    elements.chatHistory.appendChild(messageElement);
    if (autoScroll) setTimeout(scrollChatHistory, 30);
};

const createMessageSimple = (message, timestamp, color) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message`;

    let dateTime = new Date(timestamp);
    const messageWithTime = `${dateTime.getHours() < 10 ? "0" : ""}${(dateTime.getHours() == 12 || dateTime.getHours() == 0) ? "12" : dateTime.getHours() % 12}:${dateTime.getMinutes() < 10 ? "0" : ""}${dateTime.getMinutes()} ${dateTime.getHours() < 12 ? "AM" : "PM"} ${message}`;

    const chatMessage = messageCreateTextElement(messageWithTime, color, 0);
    messageElement.appendChild(chatMessage);

    elements.chatHistory.appendChild(messageElement);
    if (autoScroll) setTimeout(scrollChatHistory, 30);
    return messageElement;
};

const createUserInList = (id, aID, name, bio, pfp, roles, verified, neo, auth) => {
    const user = document.createElement("div");
    user.className = "users-user";

    let userPfp = undefined;
    if (pfp) {
        userPfp = document.createElement("img");
        userPfp.className = "user-pfp";
        userPfp.src = pfp;
    } else { // The default pfp when none is selected or its an invalid pfp
        const svgNS = "http://www.w3.org/2000/svg";
        userPfp = document.createElementNS(svgNS, "svg");
        userPfp.setAttribute("class", "user-pfp");
        userPfp.setAttribute("width", "100");
        userPfp.setAttribute("height", "100");
        userPfp.setAttribute("viewBox", "0 0 100 100");
        userPfp.innerHTML = `
            <rect xmlns=${svgNS} width="100" height="100" fill="var(--primary-color)" />
            <circle xmlns=${svgNS} cx="50" cy="100" r="50" fill="var(--accent-color)" />
            <circle xmlns=${svgNS} cx="50" cy="55" r="30" fill="var(--primary-color)" />
            <circle xmlns=${svgNS} cx="50" cy="45" r="25" fill="var(--accent-color)" />
        `;
    };
    const userName = document.createElement("p");
    if (!["shake", "hyperneo", "polychrome"].includes(neo)) {
        userName.innerText = name;
        userName.className = `user-name message-${neo}`;
    } else {
        switch (neo) {
            case "polychrome": {
                userName.className = `user-name`;
                for (let i = 0; i < name.length; i++) {
                    const letter = name[i];
                    const s = document.createElement("b");
                    s.style.animation = `ease-in-out 1s animRainbow infinite`;
                    s.style.animationDelay = `-${(i % 16) * 1000 / 16}ms`;
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
            case "hyperneo": {
                userName.className = `user-name`;
                for (let i = 0; i < name.length; i++) {
                    const letter = name[i];
                    const s = document.createElement("b");
                    s.style.animation = `ease-in-out 2s animHyperneo infinite`;
                    s.style.animationDelay = `-${(i % 8) * 1000 / 8}ms`;
                    s.style.position = "relative";
                    s.style.marginInlineEnd = "8px";
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
            case "shake": {
                userName.className = `user-name`;
                for (let i = 0; i < name.length; i++) {
                    const letter = name[i];
                    const s = document.createElement("b");
                    s.style.animation = `linear 0.5s animShake infinite`;
                    s.style.animationDelay = `-${Math.floor(Math.random() * (1000) + 1)}ms`;
                    s.style.position = "relative";
                    s.style.marginInlineEnd = "8px";
                    s.innerText = letter;
                    userName.appendChild(s);
                };
                break;
            };
        };
    };
    const openContext = (e) => {
        e.preventDefault();
        e.stopPropagation();
        elements.userContext.classList.remove("hidden");
        if (info.auth > 4) elements.userContextKick.classList.remove("hidden");
        else elements.userContextKick.classList.add("hidden");
        elements.userContext.style.top = e.pageY + "px";
        elements.userContext.style.left = e.pageX + "px";
        userContextInfo = {
            iID: id,
            aID
        };
    };
    userName.onclick = (e) => {
        if (Date.now() - contextHoldStart > contextHoldTimeframe && contextHoldStart !== 0) openContext(e);
        else {
            e.preventDefault();
            e.stopPropagation();
            switch (e.button) {
                case 0: {
                    if (aID == "-" || aID == "!") {
                        createToast("You can't view this profile.");
                    } else { // Invalid profiles do not have pfps
                        messageCreateUserBio(name, pfp, roles, bio);
                        elements.profileActionMod.onclick = (e) => {
                            createToast(`This feature is unavailable.`);
                        };
                        elements.profileActionMessage.onclick = (e) => {
                            createToast(`This feature is unavailable.`);
                        };
                        elements.profileActionBlock.onclick = (e) => {
                            ws.send(JSON.stringify({
                                type: "text",
                                content: `/block add ${aID}`
                            }));
                            console.log(aID);
                        };
                    };
                    break;
                };
            };
        };
    };
    userName.oncontextmenu = (e) => {
        openContext(e);
    };
    userName.oncontextlost = (e) => {
        elements.userContext.classList.add("hidden");
    };

    user.appendChild(userPfp);
    user.appendChild(userName);
    switch (auth) {
        case 2: {
            let userBadge = document.createElement("img");
            userBadge.className = "users-user-badge";
            userBadge.src = `${homeServer}/badges/helper.png`;
            user.appendChild(userBadge);
            break;
        };
        case 3: {
            let userBadge = document.createElement("img");
            userBadge.className = "users-user-badge";
            userBadge.src = `${homeServer}/badges/underseer.png`;
            user.appendChild(userBadge);
            break;
        };
        case 4: {
            let userBadge = document.createElement("img");
            userBadge.className = "users-user-badge";
            userBadge.src = `${homeServer}/badges/overseer.png`;
            user.appendChild(userBadge);
            break;
        };
        case 5: {
            let userBadge = document.createElement("img");
            userBadge.className = "users-user-badge";
            userBadge.src = `${homeServer}/badges/admin.png`;
            user.appendChild(userBadge);
            break;
        };
        case 6: {
            let userBadge = document.createElement("img");
            userBadge.className = "users-user-badge";
            userBadge.src = `${homeServer}/badges/developer.png`;
            user.appendChild(userBadge);
            break;
        };
    };
    if (verified) userName.insertAdjacentHTML("beforeend", `<i class="bi bi-check-circle user-verified"></i>`);
    elements.users.appendChild(user);
    return user;
};

const listAllUsers = () => {
    elements.users.innerHTML = ``;
    if (collectedUsers.friends.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Friends</h2>`);
        collectedUsers.friends.forEach((friend) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(friend.id, friend.aID, friend.name, friend.bio, friend.pfp, friend.roles, true, friend.neo, friend.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.developers.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Developers</h2>`);
        collectedUsers.developers.forEach((developer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(developer.id, developer.aID, developer.name, developer.bio, developer.pfp, developer.roles, true, developer.neo, developer.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.admins.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Admins</h2>`);
        collectedUsers.admins.forEach((admin) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(admin.id, admin.aID, admin.name, admin.bio, admin.pfp, admin.roles, true, admin.neo, admin.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.overseers.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Overseers</h2>`);
        collectedUsers.overseers.forEach((overseer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(overseer.id, overseer.aID, overseer.name, overseer.bio, overseer.pfp, overseer.roles, true, overseer.neo, overseer.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.underseers.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Underseers</h2>`);
        collectedUsers.underseers.forEach((underseer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(underseer.id, underseer.aID, underseer.name, underseer.bio, underseer.pfp, underseer.roles, true, underseer.neo, underseer.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.helpers.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Helpers</h2>`);
        collectedUsers.helpers.forEach((helper) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(helper.id, helper.aID, helper.name, helper.bio, helper.pfp, helper.roles, true, helper.neo, helper.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.users.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Users</h2>`);
        collectedUsers.users.forEach((user) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(user.id, user.aID, user.name, user.bio, user.pfp, user.roles, true, user.neo, user.auth);
        });
        //elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.guests.length > 0) {
        elements.users.insertAdjacentHTML("beforeend", `<h2 style="text-align: center; color: white; user-select: none;">Guests</h2>`);
        collectedUsers.guests.forEach((guest) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(guest.id, guest.aID, guest.name, guest.bio, guest.pfp, guest.roles, false, guest.neo, guest.auth);
        });
    };
    if (collectedUsers.guests.length < 1 &&
        collectedUsers.users.length < 1 &&
        collectedUsers.helpers.length < 1 &&
        collectedUsers.underseers.length < 1 &&
        collectedUsers.overseers.length < 1 &&
        collectedUsers.admins.length < 1 &&
        collectedUsers.developers.length < 1 &&
        collectedUsers.friends.length < 1
    ) {
        elements.users.innerHTML += `<p style="text-align: center; color: white; user-select: none;">Nobody here!</p>`;
    };
};

const showDataUsers = (order) => {
    let data = dataUsers;
    switch (order) {
        case "auth": {
            data = dataUsers.toSorted((a, b) => b.auth - a.auth || a.name.localeCompare(b.name));
            break;
        };
        case "newest": {
            data = dataUsers.toSorted((a, b) => b.dID - a.dID);
            break;
        };
    };
    elements.dataTableBody.innerHTML = "";
    if (!settings.show_all) data = data.filter(d => d.creatorID === info.aID || d.name === info.name);
    data.forEach(account => {
        const main = document.createElement("tr");
        main.className = "data-account";
        // dID
        const dID = document.createElement("td");
        dID.innerText = account.dID;
        // Name
        const name = document.createElement("td");
        if ((info.auth > account.auth && info.auth > 3) || info.name === account.name || info.aID === account.creatorID) {
            const editName = document.createElement("input");
            editName.value = account.name;
            editName.placeholder = "Display name...";
            editName.maxLength = "35";
            editName.minLength = "1";
            editName.className = "data-name";
            editName.type = "text";
            name.appendChild(editName);
        } else {
            name.className = "data-name";
            name.innerText = account.name;
        }
        // aID
        const aID = document.createElement("td");
        aID.innerText = account.aID;
        // Token
        const token = document.createElement("td");
        if ((info.auth > account.auth && info.auth > 3) || info.name === account.name || info.aID === account.creatorID) {
            const editToken = document.createElement("input");
            editToken.value = account.token ?? "";
            editToken.maxLength = "100";
            editToken.minLength = "1";
            editToken.placeholder = "Token";
            editToken.type = "text";
            token.appendChild(editToken);
        } else {
            token.innerText = account.token ?? "-";
        };
        // Access Level
        const access = document.createElement("td");
        if (info.auth > 5 && (info.auth > account.auth && info.auth > 3)) {
            const editAccess = document.createElement("select");
            if (info.auth > 5) {
                // Developer
                const oDeveloper = document.createElement("option");
                oDeveloper.value = 6;
                oDeveloper.innerText = "Developer (6)";
                editAccess.appendChild(oDeveloper);
                // Admin
                const oAdmin = document.createElement("option");
                oAdmin.value = 5;
                oAdmin.innerText = "Admin (5)";
                editAccess.appendChild(oAdmin);
                // Overseer
                const oOverseer = document.createElement("option");
                oOverseer.value = 4;
                oOverseer.innerText = "Overseer (4)";
                editAccess.appendChild(oOverseer);
                // Underseer
                const oUnderseer = document.createElement("option");
                oUnderseer.value = 3;
                oUnderseer.innerText = "Underseer (3)";
                editAccess.appendChild(oUnderseer);
                // Helper
                const oHelper = document.createElement("option");
                oHelper.value = 2;
                oHelper.innerText = "Helper (2)";
                editAccess.appendChild(oHelper);
            };
            if (info.auth > 2) {
                // User
                const oUser = document.createElement("option");
                oUser.value = 1;
                oUser.innerText = "User (1)";
                editAccess.appendChild(oUser);
            };
            if (info.auth > 5) {
                // Registered Guest
                const oGuest = document.createElement("option");
                oGuest.value = 0;
                oGuest.innerText = "Registered Guest (0)";
                editAccess.appendChild(oGuest);
            };
            editAccess.value = account.auth;
            access.appendChild(editAccess);
        } else {
            access.innerText = `${account.auth === 6 ? "Developer" : account.auth === 5 ? "Admin" : account.auth === 4 ? "Overseer" : account.auth === 3 ? "Underseer" : account.auth === 2 ? "Helper" : account.auth === 1 ? "User" : "Registered Guest"} (${account.auth})`;
        }
        // Creator
        const creator = document.createElement("td");
        creator.innerText = account.creator;
        // Operations
        const ops = document.createElement("td");
        ops.className = "data-operations";
        if ((info.auth > account.auth && info.auth > 3) || info.name === account.name || info.aID === account.creatorID) {
            const opUpdate = document.createElement("button");
            opUpdate.innerText = "Update";
            opUpdate.onclick = (e) => {
                // ws.send(JSON.stringify({
                //     type: "text",
                //     content: `/block add ${aID}`
                // }));
                postDataChanges(
                    account.dID,
                    name.children.length > 0 && name.children.item(0).value !== account.name ? name.children.item(0).value : null,
                    token.children.length > 0 && token.children.item(0).value !== account.token ? token.children.item(0).value : null,
                    access.children.length > 0 && access.children.item(0).value !== account.auth ? access.children.item(0).value : null
                ).then((r) => {
                    refreshData();
                });
            };
            const opDelete = document.createElement("button");
            opDelete.innerText = "Delete";
            opDelete.onclick = (e) => {
                postDataDelete(account.dID).then((r) => {
                    refreshData();
                });
            };
            ops.appendChild(opUpdate);
            ops.appendChild(opDelete);
        } else {
            ops.innerText = "-";
        };

        main.appendChild(dID);
        main.appendChild(name);
        main.appendChild(aID);
        main.appendChild(token);
        main.appendChild(access);
        main.appendChild(creator);
        main.appendChild(ops);
        elements.dataTableBody.appendChild(main);
    });
};

// GET and POST Requests
const postTokenAuth = async () => {
    try {
        const response = await fetch(`${endpointAddress}/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: elements.barToken.value.toString().trim()
            })
        });
        if (!response.ok) {
            elements.authError.innerText = `Error: ${await response.text()}`;
            elements.authError.classList.remove("hidden");
        } else {
            const data = await response.json();
            if (!data.sessionID) {
                elements.authError.innerText = `Error: Could not find sessionID.`;
                elements.authError.classList.remove("hidden");
            } else {
                elements.authError.classList.add("hidden");
                sessionID = data.sessionID;
                ws.send(payloadAuth());
            };
        }
    } catch (e) {
        elements.authError.innerText = `Error: ${e.message}`;
        elements.authError.classList.remove("hidden");
    };
};

const postDataChanges = async (dID, newName, newToken, newAuth) => {
    try {
        let b = {
            sessionID: sessionID,
            dID: dID,
        };
        if (newName) b["newName"] = newName;
        if (newToken) b["newToken"] = newToken;
        if (newAuth) b["newAuth"] = newAuth;
        const response = await fetch(`${endpointAddress}/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(b)
        });
        if (!response.ok) {
            createToast(`Error: ${await response.text()}`);
        } else {
            createToast(await response.text());
        }
    } catch (e) {
        createToast(`Error: ${e.message}`);
    };
};

const postDataDelete = async (dID) => {
    try {
        const response = await fetch(`${endpointAddress}/delete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                sessionID: sessionID,
                dID: dID
            })
        });
        if (!response.ok) {
            createToast(`Error: ${await response.text()}`);
        } else {
            createToast(await response.text());
        }
    } catch (e) {
        createToast(`Error: ${e.message}`);
    };
};

// Utility functions to quickly create payloads for sending
const payloadText = (content) => {
    return JSON.stringify({
        type: "text",
        content,
        replyID: messageReplyID,
        dm: messageReplyDM
    });
};

const payloadUploadRequest = () => {
    return JSON.stringify({
        type: "uwarn",
        mime: uploadMime,
        size: uploadSize
    });
};

const payloadAuth = () => {
    return JSON.stringify({
        type: "auth",
        sessionID
    });
};

const payloadUnauth = () => {
    return JSON.stringify({
        type: "unauth"
    });
};

// ws functions are for WebSockets
const wsOpen = () => {
    elements.loading.classList.add("hidden");
    elements.main.classList.remove("hidden");
    console.log(`Connected to the server!`);
    setInterval(() => {
        ws.send(JSON.stringify({ "type": "ping" }));
    }, 200);
};

const wsMessage = (data, isBinary) => {
    let isBinaryTrue = isBinary || data.data instanceof ArrayBuffer || data.data instanceof Blob;
    if (!isBinaryTrue) {
        const message = JSON.parse(data.data.toString());
        switch (message.type) {
            case "text": {
                console.log(message);
                createMessageText(
                    message.sender.name,
                    message.sender.auth,
                    message.sender.pfp,
                    message.sender.roles,
                    message.sender.bio,
                    message.sender.aID != "-",
                    message.content,
                    message.neo,
                    message.color,
                    message.timestamp,
                    message.sender.iID,
                    message.sender.aID,
                    message.id,
                    message.reply,
                    message.dm,
                    message.canReply);
                break;
            };
            case "simple": {
                createMessageSimple(message.content, message.timestamp, message.color);
                break;
            };
            case "pong": {
                info = message;
                if (info.auth > 2) {
                    elements.toggleData.classList.remove("hidden");
                } else elements.toggleData.classList.add("hidden");
                break;
            };
            case "users": {
                collectedUsers = {
                    guests: message.guests,
                    users: message.users,
                    helpers: message.helpers,
                    underseers: message.underseers,
                    overseers: message.overseers,
                    admins: message.admins,
                    developers: message.developers,
                    friends: message.friends
                };
                listAllUsers();
                break;
            };
            case "greet": {
                collectedUsers = {
                    guests: message.guests,
                    users: message.users,
                    helpers: message.helpers,
                    underseers: message.underseers,
                    overseers: message.overseers,
                    admins: message.admins,
                    developers: message.developers,
                    friends: message.friends
                };
                message.history.forEach((msg) => {
                    msg = JSON.parse(msg);
                    createMessageText(
                        msg.sender.name,
                        msg.sender.auth,
                        msg.sender.pfp,
                        msg.sender.roles,
                        msg.sender.bio,
                        msg.sender.aID != "-",
                        msg.content,
                        msg.neo,
                        msg.color,
                        msg.timestamp,
                        msg.sender.iID,
                        msg.sender.aID,
                        msg.id,
                        msg.reply,
                        msg.dm,
                        msg.canReply);
                });
                setTimeout(scrollChatHistory, 30);
                break;
            };
            case "uwarn": {
                nextUpload = message;
                break;
            };
            case "greenlight": {
                if (readyFile) {
                    ws.send(readyFile);
                    readyFile = undefined;
                };
                break;
            };
            case "clearall": {
                elements.chatHistory.innerHTML = ``;
                break;
            };
            case "mix": {
                if (settings.allow_mixer) {
                    // mixAudio.crossOrigin = "anonymous";
                    mixAudio.src = `${message.src}`;
                    mixAudio.load();
                    mixAudio.oncanplay = (r) => {
                        mixAudio.play().then((e) => {
                            createToast(`Now playing: "${message.src.split("/").pop()}"`);
                        }).catch((e) => {
                            createToast(`Could not play requested audio: ${e.message}`);
                        });
                    };
                    mixAudio.onerror = (e) => {
                        createToast(`Could not play requested audio: ${mixAudio.error.message} (code ${mixAudio.error.code})`);
                    };
                };
                break;
            }
            case "auth": {
                if (message.ok) {
                    elements.auth.classList.add("hidden");
                    elements.viewport.classList.remove("hidden");
                    elements.users.classList.remove("hidden");
                    elements.backToAuth.classList.remove("hidden");
                    collectedUsers = {
                        guests: message.guests,
                        users: message.users,
                        helpers: message.helpers,
                        underseers: message.underseers,
                        overseers: message.overseers,
                        admins: message.admins,
                        developers: message.developers,
                        friends: message.friends
                    };
                    listAllUsers();
                    createToast("You are now logged in.");
                    setTimeout(scrollChatHistory, 30);
                } else {
                    elements.authError.innerText = `Error: ${message.text}`;
                    elements.authError.classList.remove("hidden");
                };
                break;
            };
            default: {
                console.warn(`Unhandled response from server: '${message.type}'.`);
                break;
            };
        };
    } else {
        let imgblob;
        if (data.data instanceof ArrayBuffer) {
            imgblob = new Blob([data.data], { mime: nextUpload.mime });
        } else {
            imgblob = data.data;
        };
        createMessageUpload(nextUpload.sender.name, nextUpload.auth, nextUpload.sender.pfp, nextUpload.sender.roles, nextUpload.sender.bio, nextUpload.sender.aID != "-", imgblob, nextUpload.mime, nextUpload.neo, nextUpload.timestamp, nextUpload.sender.iID, nextUpload.sender.aID, nextUpload.id);
    };
};

const wsClose = (e) => {
    elements.disconnect.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
    elements.loading.classList.add("hidden");
    elements.disconnectCode.innerText = `Exit code: ${e.code ? e.code : "No code given."}`;
    elements.disconnectReason.innerText = `Reason: ${e.reason && e.reason !== "" ? e.reason : e.code == 1006 ? "Unhandled error." : "No reason given."}`;
    createToast(`WebSocket has closed! ${e.code ? e.code : "No code given"}: ${e.reason && e.reason !== "" ? e.reason : e.code == 1006 ? "Unhandled error." : "No reason given."}`);
    console.error(`WebSocket has closed! ${e.code ? e.code : "No code given"}: ${e.reason && e.reason !== "" ? e.reason : e.code == 1006 ? "Unhandled error." : "No reason given."}`);
};

// e functions are for events
const eVisitAsGuest = (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.auth.classList.add("hidden");
    elements.users.classList.remove("hidden");
    elements.viewport.classList.remove("hidden");
    elements.backToAuth.classList.remove("hidden");
    if (settings.show_users) {
        elements.optionsViewUser.className = "bi bi-toggle-on";
        elements.users.classList.remove("hidden");
        if (settings.show_ui) elements.viewport.style.width = "80%";
        else elements.viewport.style.width = "60%";
    } else {
        elements.optionsViewUser.className = "bi bi-toggle-off";
        elements.users.classList.add("hidden");
        if (settings.show_ui) elements.viewport.style.width = "100%";
        else elements.viewport.style.width = "80%";
    };
    if (autoScroll) scrollChatHistory();
};

const eCreateMessage = () => {
    if (elements.barMessage.value !== "") {
        ws.send(payloadText(elements.barMessage.value));
        elements.barMessage.value = "";
        messageReplyID = "-";
        messageReplyDM = false;
        elements.chatReply.classList.add("hidden");
    };
};

const eUploadFile = () => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(uploadFile);
    reader.onload = () => {
        readyFile = reader.result;
        ws.send(payloadUploadRequest());
    };
};

const eInitiateReply = (user, message, id, dm) => {
    elements.chatReply.classList.remove("hidden");
    elements.replyUser.innerText = `Replying to: ${user}`;
    let sampleSize = 80;
    let sample = message.slice(0, sampleSize);
    if (sample.length == sampleSize) sample += "-...";
    if (settings.filter_slurs) sample = sample.replace(slursRegex, (m) => "*".repeat(m.length));
    if (settings.filter_swears) sample = sample.replace(swearsRegex, (m) => "*".repeat(m.length));
    elements.replyContent.innerText = `${sample}`;
    messageReplyID = id;
    messageReplyDM = dm;
    if (autoScroll) setTimeout(scrollChatHistory, 30);
};

const eUpdate = () => {
    let displayTime = `${info.timeout > 1000 * 60 ? (Math.trunc(info.timeout / 60000) + 1 + " minute(s)") : (Math.trunc(info.timeout / 1000) + 1 + " second(s)")}`;
    elements.chatInfo.innerText = info.timeout < 1 ? "No status." : `Slowmode: please wait ${displayTime}...`;
    // elements.barMessage.disabled = info.timeout > 0;
    elements.barMessage.placeholder = info.timeout > 0 ? `Please wait ${displayTime}...` : "Enter your message to send here.";
    elements.chatChannel.innerText = `Channel: ${info.channel}`;
    let scrollLeniency = elements.chatHistory.clientHeight / 3;
    autoScroll = elements.chatHistory.scrollTop + scrollLeniency >= elements.chatHistory.scrollHeight - elements.chatHistory.clientHeight;
    if (!autoScroll) elements.scrollButton.classList.remove("invisible");
    else elements.scrollButton.classList.add("invisible");
    // if (settings.show_ui) {
    //     if ((window.innerWidth <= 600 && !maximizeUsers) || (!settings.show_users && window.innerWidth > 600)) {
    //         elements.users.classList.add("hidden");
    //         elements.viewport.style.width = "100%";
    //     } else if (elements.auth.classList.contains("hidden")) {
    //         elements.users.classList.remove("hidden");
    //         elements.viewport.style.width = "80%";
    //     };
    // };
    // if (window.innerWidth < 600) {
    //     if (settings.show_ui && elements.auth.classList.contains("hidden")) {
    //         elements.toggleUsers.classList.remove("hidden");
    //     } else {
    //         elements.toggleUsers.classList.add("hidden");
    //     };
    // } else {
    //     if (elements.auth.classList.contains("hidden") && elements.users.classList.contains("hidden")) elements.users.classList.remove("hidden");
    //     elements.users.style.width = "20%";
    //     elements.viewport.style.width = "80%";
    // };
    // Visibility of user list and viewport
    if (!elements.auth.classList.contains("hidden")) {
        if (!elements.users.classList.contains("hidden")) elements.users.classList.add("hidden");
        if (!elements.viewport.classList.contains("hidden")) elements.viewport.classList.add("hidden");
    } else {
        if (!maximizeUsers) {
            if (elements.users.classList.contains("hidden")) elements.users.classList.add("hidden");
            if (elements.viewport.classList.contains("hidden")) elements.viewport.classList.add("hidden");
            if (settings.show_ui) {
                elements.users.style.width = "20%";
                elements.viewport.style.width = "80%";
                if (window.innerWidth >= window.innerHeight) {
                    if (elements.users.classList.contains("hidden")) elements.users.classList.remove("hidden");
                };
            };
        } else {
            // elements.viewport.classList.add("hidden");
            // elements.users.classList.remove("hidden");
            // elements.users.style.width = "100%";
            if (settings.show_ui) {
                if (!elements.viewport.classList.contains("hidden")) elements.viewport.classList.add("hidden");
                if (elements.users.classList.contains("hidden")) elements.users.classList.remove("hidden");
                elements.users.style.width = "100%";
            };
        };
    };
    // Whether we can maximize the user list
    if (settings.show_ui) {
        if (window.innerWidth < window.innerHeight || !settings.show_users) {
            if (elements.toggleUsers.classList.contains("hidden")) elements.toggleUsers.classList.remove("hidden");
            if (!elements.users.classList.contains("hidden") && !maximizeUsers) elements.users.classList.add("hidden");
            // if (!elements.users.classList.contains("hidden")) elements.users.classList.add("hidden");
            elements.viewport.style.width = "100%";
        } else {
            if (!elements.toggleUsers.classList.contains("hidden")) elements.toggleUsers.classList.add("hidden");
            if (maximizeUsers) {
                maximizeUsers = false;
                if (elements.viewport.classList.contains("hidden")) elements.viewport.classList.remove("hidden");
                elements.viewport.style.width = "80%";
                elements.users.style.width = "20%";
            };
        };
    } else {
        if (!elements.toggleUsers.classList.contains("hidden")) elements.toggleUsers.classList.add("hidden");
    }
    requestAnimationFrame(eUpdate);
};

const eAuthenticate = () => {
    postTokenAuth();
    elements.barToken.value = "";
};

const eHandlePreview = (url, mime) => {
    elements.imageConfirmImage.classList.add("hidden");
    elements.imageConfirmVideo.classList.add("hidden");
    elements.imageConfirmAudio.classList.add("hidden");
    elements.imageConfirmError.classList.add("hidden");
    switch (mime.split("/")[0]) {
        case "image": {
            elements.imageConfirmImage.classList.remove("hidden");
            elements.imageConfirmImage.src = url;
            break;
        };
        case "audio": {
            elements.imageConfirmAudio.classList.remove("hidden");
            elements.imageConfirmAudio.src = url;
            break;
        };
        case "video": {
            elements.imageConfirmVideo.classList.remove("hidden");
            elements.imageConfirmVideoSource.src = url;
            elements.imageConfirmVideoSource.type = mime;
            elements.imageConfirmVideo.load();
            break;
        };
        default: {
            elements.imageConfirmError.classList.remove("hidden");
            break;
        };
    };
};

document.onclick = (e) => {
    if (e.target !== elements.userContext && !elements.userContext.classList.contains("hidden")) {
        elements.userContext.classList.add("hidden");
    };
};

elements.backToAuth.onclick = () => {
    sessionID = "-";
    elements.backToAuth.classList.add("hidden");
    elements.users.classList.add("hidden");
    elements.viewport.classList.add("hidden");
    elements.auth.classList.remove("hidden");
    ws.send(payloadUnauth());
};

elements.togglePings.onclick = () => {
    settings.allow_pings = !settings.allow_pings;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.allow_pings) elements.togglePings.className = "bi bi-bell header-icons";
    else elements.togglePings.className = "bi bi-bell-slash header-icons";
};

elements.toggleDark.onclick = () => {
    settings.dark_theme = !settings.dark_theme;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.dark_theme) {
        elements.toggleDark.className = "bi bi-moon-stars-fill header-icons";
        // if (!settings.seasonal_theme) {
        document.body.classList.remove("theme-light");
        document.body.classList.add("theme-dark");
        // } else {
        //     document.body.classList.remove("theme-seasonal-light");
        //     document.body.classList.add("theme-seasonal-dark");
        // }
    } else {
        elements.toggleDark.className = "bi bi-sun-fill header-icons";
        // if (!settings.seasonal_theme) {
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
        // } else {
        //     document.body.classList.remove("theme-seasonal-dark");
        //     document.body.classList.add("theme-seasonal-light");
        // }
    };
};

elements.barAuth.onclick = () => eAuthenticate();
elements.barToken.onkeydown = (e) => {
    if (e.key == "Enter") {
        eAuthenticate();
    };
};
elements.visitAsGuest.onclick = (e) => eVisitAsGuest(e);

elements.cancelReply.onclick = (e) => {
    messageReplyID = "-";
    messageReplyDM = false;
    elements.chatReply.classList.add("hidden");
};
elements.barSend.onclick = () => {
    if (info.timeout < 1 || elements.barMessage.value[0] == "/") {
        eCreateMessage();
    } else {
        let displayTime = `${info.timeout > 1000 * 60 ? (Math.trunc(info.timeout / 60000) + 1 + " minute(s)") : (Math.trunc(info.timeout / 1000) + 1 + " second(s)")}`;
        createToast(`Please wait ${displayTime}...`);
    };
};
elements.barMessage.onkeydown = (e) => {
    if (e.key == "Enter") {
        if (info.timeout < 1 || elements.barMessage.value[0] == "/") {
            eCreateMessage();
        } else {
            let displayTime = `${info.timeout > 1000 * 60 ? (Math.trunc(info.timeout / 60000) + 1 + " minute(s)") : (Math.trunc(info.timeout / 1000) + 1 + " second(s)")}`;
            createToast(`Please wait ${displayTime}...`);
        };
    };
};
elements.barMessage.onpaste = (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            uploadFile = items[i].getAsFile();
            uploadMime = uploadFile.type;
            uploadSize = uploadFile.size;
            elements.imageConfirm.classList.remove("hidden");
            elements.screen.classList.remove("hidden");
            elements.barImage.value = "";
            eHandlePreview(URL.createObjectURL(uploadFile), uploadMime);
        };
    }
};
elements.scrollButton.onclick = (e) => {
    scrollChatHistory();
};
elements.main.onclick = (e) => {
    if (e.target === e.currentTarget) {
        if (!elements.emoteList.classList.contains("hidden")) elements.emoteList.classList.add("hidden");
    };
};
elements.barEmote.onclick = (e) => {
    elements.emoteList.classList.contains("hidden") ? elements.emoteList.classList.remove("hidden") : elements.emoteList.classList.add("hidden");
};

/* Emoji onclicks */
elements.emojiSmile.onclick = (e) => {
    elements.barMessage.value += ":smile:";
};
elements.emojiNeutral.onclick = (e) => {
    elements.barMessage.value += ":neutral:";
};
elements.emojiFrown.onclick = (e) => {
    elements.barMessage.value += ":frown:";
};
elements.emojiAngry.onclick = (e) => {
    elements.barMessage.value += ":angry:";
};
elements.emojiLaughing.onclick = (e) => {
    elements.barMessage.value += ":laughing:";
};
elements.emojiSurprise.onclick = (e) => {
    elements.barMessage.value += ":surprise:";
};
elements.emojiSunglasses.onclick = (e) => {
    elements.barMessage.value += ":sunglasses:";
};
elements.emojiHeartEyes.onclick = (e) => {
    elements.barMessage.value += ":hearteyes:";
};
elements.emojiKiss.onclick = (e) => {
    elements.barMessage.value += ":kiss:";
};
elements.emojiTear.onclick = (e) => {
    elements.barMessage.value += ":tear:";
};
elements.emojiWink.onclick = (e) => {
    elements.barMessage.value += ":wink:";
};
elements.emojiAstonished.onclick = (e) => {
    elements.barMessage.value += ":astonished:";
};
elements.emojiDizzy.onclick = (e) => {
    elements.barMessage.value += ":dizzy:";
};
elements.emojiExpressionless.onclick = (e) => {
    elements.barMessage.value += ":expressionless:";
};


/* Emotes and Onclick Events */
const createNewEmote = (emoteList, emoteKey) => {
    const emoteElement = document.createElement("img");
    emoteElement.className = "emote";
    emoteElement.src = `${homeServer}/${allEmotes[emoteKey]}`;
    emoteElement.onclick = (e) => {
        elements.barMessage.value += `:${emoteKey}:`;
    };
    emoteList.appendChild(emoteElement);
    return emoteElement;
};

Object.keys(emotes).forEach((emoteCategory) => {
    Object.keys(emotes[emoteCategory]).forEach((emote) => {
        createNewEmote(elements[emoteCategory], emote);
    });
});
elements.userContextKick.onclick = (e) => {
    ws.send(JSON.stringify({
        type: "text",
        content: `/kick ${userContextInfo.iID}`
    }));
    createToast(`Kicked the account!`);
    elements.userContext.classList.add("hidden");
};
elements.userContextCopyIID.onclick = (e) => {
    navigator.clipboard.writeText(userContextInfo.iID);
    createToast(`Copied the Instance ID!`);
    elements.userContext.classList.add("hidden");
};
elements.userContextCopyAID.onclick = (e) => {
    navigator.clipboard.writeText(userContextInfo.aID);
    createToast(`Copied the Account ID!`);
    elements.userContext.classList.add("hidden");
};
elements.userContextCancel.onclick = (e) => {
    elements.userContext.classList.add("hidden");
};

// Book
elements.helper.onclick = (e) => {
    elements.screen.classList.remove("hidden");
    elements.book.classList.remove("hidden");
};
elements.closeBook.onclick = (e) => {
    elements.screen.classList.add("hidden");
    elements.book.classList.add("hidden");
};
elements.bookAbout.onclick = (e) => {
    // Tabs
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookAbout.classList.remove("book-side-option");
    elements.bookAbout.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.remove("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};
elements.bookRules.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option");
    elements.bookRules.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.remove("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};
elements.bookChangelog.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option");
    elements.bookChangelog.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.remove("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};
elements.bookAdmins.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option");
    elements.bookAdmins.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.remove("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};
elements.bookCommands.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option");
    elements.bookCommands.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.remove("hidden");
    elements.bookSupportContent.classList.add("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};
elements.bookSupport.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookSupport.classList.remove("book-side-option");
    elements.bookSupport.classList.add("book-side-option-h");
    elements.bookCredits.classList.remove("book-side-option-h");
    elements.bookCredits.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.remove("hidden");
    elements.bookCreditsContent.classList.add("hidden");
};

elements.bookCredits.onclick = (e) => {
    // Tabs
    elements.bookAbout.classList.remove("book-side-option-h");
    elements.bookAbout.classList.add("book-side-option");
    elements.bookAdmins.classList.remove("book-side-option-h");
    elements.bookAdmins.classList.add("book-side-option");
    elements.bookCommands.classList.remove("book-side-option-h");
    elements.bookCommands.classList.add("book-side-option");
    elements.bookRules.classList.remove("book-side-option-h");
    elements.bookRules.classList.add("book-side-option");
    elements.bookChangelog.classList.remove("book-side-option-h");
    elements.bookChangelog.classList.add("book-side-option");
    elements.bookCredits.classList.remove("book-side-option");
    elements.bookCredits.classList.add("book-side-option-h");
    elements.bookSupport.classList.remove("book-side-option-h");
    elements.bookSupport.classList.add("book-side-option");
    // Content
    elements.bookAboutContent.classList.add("hidden");
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookCreditsContent.classList.remove("hidden");
    elements.bookSupportContent.classList.add("hidden");
};

// Data
elements.closeData.onclick = (e) => {
    elements.screen.classList.add("hidden");
    elements.data.classList.add("hidden");
};
elements.dataSearch.oninput = ((e) => {
    const search = elements.dataSearch.value.trim().toLowerCase();
    if (!search || search === "") {
        for (let i = 0; i < elements.dataTableBody.children.length; i++) {
            const account = elements.dataTableBody.children[i];
            account.classList.remove("hidden");
        };
    } else {
        for (let i = 0; i < elements.dataTableBody.children.length; i++) {
            const account = elements.dataTableBody.children[i];
            console.log(account.querySelector(".data-name").tagName === "INPUT" ? account.querySelector(".data-name").value : "");
            if (account.querySelector(".data-name").tagName === "INPUT" ? account.querySelector(".data-name").value.trim().toLowerCase().includes(search) : account.querySelector(".data-name").innerText.trim().toLowerCase().includes(search)) {
                account.classList.remove("hidden");
            } else {
                account.classList.add("hidden");
            };
        };
    };
});
elements.dataRefresh.onclick = async (e) => {
    refreshData();
};

// Profile
elements.closeProfile.onclick = (e) => {
    elements.screen.classList.add("hidden");
    elements.profile.classList.add("hidden");
};

elements.toggleUsers.onclick = (e) => {
    maximizeUsers = !maximizeUsers;
    if (maximizeUsers) {
        elements.viewport.classList.add("hidden");
        elements.users.classList.remove("hidden");
        elements.users.style.width = "100%";
    } else {
        elements.viewport.classList.remove("hidden");
        elements.users.classList.add("hidden");
        elements.users.style.width = "20%";
    };
};

// Options
elements.toggleOptions.onclick = (e) => {
    elements.screen.classList.remove("hidden");
    elements.options.classList.remove("hidden");
};
elements.optionsClose.onclick = (e) => {
    elements.screen.classList.add("hidden");
    elements.options.classList.add("hidden");
};
elements.optionsViewUser.onclick = (e) => {
    if (elements.auth.classList.contains("hidden")) {
        settings.show_users = !settings.show_users;
        localStorage.setItem("settings", JSON.stringify(settings));
        if (!maximizeUsers) {
            if (settings.show_users) {
                elements.optionsViewUser.className = "bi bi-toggle-on";
                elements.users.classList.remove("hidden");
                if (settings.show_ui) elements.viewport.style.width = "100%";
                else elements.viewport.style.width = "60%";
            } else {
                elements.optionsViewUser.className = "bi bi-toggle-off";
                elements.users.classList.add("hidden");
                if (settings.show_ui) elements.viewport.style.width = "100%";
                else elements.viewport.style.width = "80%";
            };
        };
    };
};
elements.optionsViewUI.onclick = (e) => {
    settings.show_ui = !settings.show_ui;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.show_ui) {
        elements.optionsViewUI.className = "bi bi-toggle-on";
        elements.sheet.href = "overhaul.css";
        if (settings.show_users) elements.viewport.style.width = "80%";
        else elements.viewport.style.width = "100%";
    } else {
        elements.optionsViewUI.className = "bi bi-toggle-off";
        elements.sheet.href = "style.css";
        if (settings.show_users) elements.viewport.style.width = "60%";
        else elements.viewport.style.width = "80%";
    };
};
elements.optionsViewSwears.onclick = (e) => {
    settings.filter_swears = !settings.filter_swears;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.filter_swears) {
        elements.optionsViewSwears.className = "bi bi-toggle-on";
    } else {
        elements.optionsViewSwears.className = "bi bi-toggle-off";
    };
};
elements.optionsViewSlurs.onclick = (e) => {
    settings.filter_slurs = !settings.filter_slurs;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.filter_slurs) {
        elements.optionsViewSlurs.className = "bi bi-toggle-on";
    } else {
        elements.optionsViewSlurs.className = "bi bi-toggle-off";
    };
};
elements.optionsShowAll.onclick = (e) => {
    settings.show_all = !settings.show_all;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.show_all) {
        elements.optionsShowAll.className = "bi bi-toggle-on";
    } else {
        elements.optionsShowAll.className = "bi bi-toggle-off";
    };
};
elements.optionsTAbyss.onclick = (e) => {
    settings.abyss_theme = !settings.abyss_theme;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.abyss_theme) {
        elements.optionsTAbyss.className = "bi bi-toggle-on";
        document.body.classList.add("theme-abyss");
    } else {
        elements.optionsTAbyss.className = "bi bi-toggle-off";
        document.body.classList.remove("theme-abyss");
    };
};
elements.optionsTNight.onclick = (e) => {
    settings.night_theme = !settings.night_theme;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.night_theme) {
        elements.optionsTNight.className = "bi bi-toggle-on";
        document.body.classList.add("theme-night");
    } else {
        elements.optionsTNight.className = "bi bi-toggle-off";
        document.body.classList.remove("theme-night");
    };
};
elements.optionsTAqua.onclick = (e) => {
    settings.aqua_theme = !settings.aqua_theme;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.aqua_theme) {
        elements.optionsTAqua.className = "bi bi-toggle-on";
        document.body.classList.add("theme-aqua");
    } else {
        elements.optionsTAqua.className = "bi bi-toggle-off";
        document.body.classList.remove("theme-aqua");
    };
};
elements.optionsExpMixer.onclick = (e) => {
    settings.allow_mixer = !settings.allow_mixer;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.allow_mixer) {
        elements.optionsExpMixer.className = "bi bi-toggle-on";
    } else {
        elements.optionsExpMixer.className = "bi bi-toggle-off";
    };
};
elements.optionsExpSeasonalTheme.onclick = (e) => {
    settings.seasonal_theme = !settings.seasonal_theme;
    localStorage.setItem("settings", JSON.stringify(settings));
    if (settings.seasonal_theme) {
        elements.optionsExpSeasonalTheme.className = "bi bi-toggle-on";
        // document.body.classList.remove("theme-light");
        // document.body.classList.remove("theme-dark");
        // if (settings.dark_theme) {
        //     document.body.classList.remove("theme-seasonal-light");
        //     document.body.classList.add("theme-seasonal-dark");
        // } else {
        //     document.body.classList.remove("theme-seasonal-dark");
        //     document.body.classList.add("theme-seasonal-light");
        // }
    } else {
        elements.optionsExpSeasonalTheme.className = "bi bi-toggle-off";
        // document.body.classList.remove("theme-seasonal-light");
        // document.body.classList.remove("theme-seasonal-dark");
        // if (settings.dark_theme) {
        //     document.body.classList.remove("theme-light");
        //     document.body.classList.add("theme-dark");
        // } else {
        //     document.body.classList.remove("theme-dark");
        //     document.body.classList.add("theme-light");
        // }
    }
};
elements.door.onclick = (e) => createToast(`It's locked...`);

elements.modHeader.onmousedown = (e) => {
    dragMod = true;
    modLocation.x = e.clientX;
    modLocation.y = e.clientY;
    elements.modHeader.onmouseup = (e) => {
        dragMod = false;
        // elements.modHeader.onmousemove = null;
    };
};
window.onmousemove = (e) => {
    if (dragMod) {
        let newX = modLocation.x - e.clientX;
        let newY = modLocation.y - e.clientY;
        modLocation.x = e.clientX;
        modLocation.y = e.clientY;
        elements.mod.style.left = `${elements.mod.offsetLeft - newX}px`;
        elements.mod.style.top = `${elements.mod.offsetTop - newY}px`;
    };
};
window.ondragover = (e) => {
    e.preventDefault();
    e.stopPropagation();
};
window.ondrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
        uploadFile = e.dataTransfer.files[0];
        uploadMime = uploadFile.type;
        uploadSize = uploadFile.size;
        elements.imageConfirm.classList.remove("hidden");
        elements.screen.classList.remove("hidden");
        elements.barImage.value = "";
        eHandlePreview(URL.createObjectURL(uploadFile), uploadMime);
    };
};

elements.barClip.onclick = () => elements.barImage.click();
elements.barImage.onchange = () => {
    uploadFile = elements.barImage.files.item(0);
    uploadMime = uploadFile.type;
    uploadSize = uploadFile.size;
    elements.imageConfirm.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
    elements.barImage.value = "";
    eHandlePreview(URL.createObjectURL(uploadFile), uploadMime);
};

elements.openTosPp.onclick = () => {
    elements.tosPp.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
};
elements.altOpenTosPp.onclick = () => {
    elements.tosPp.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
};
elements.closeTosPp.onclick = () => {
    elements.tosPp.classList.add("hidden");
    elements.screen.classList.add("hidden");
};

elements.imageEnlargerClose.onclick = () => {
    elements.screen.classList.add("hidden");
    elements.imageEnlarger.classList.add("hidden");
}

elements.imageConfirmN.onclick = () => {
    elements.imageConfirm.classList.add("hidden");
    elements.screen.classList.add("hidden");
};

elements.imageConfirmY.onclick = () => {
    elements.imageConfirm.classList.add("hidden");
    elements.screen.classList.add("hidden");
    // createMessageUpload(user.name, user.pfp, user.verified, uploadFile, user.neo);
    if (uploadFile) eUploadFile();
};

elements.toggleData.onclick = (e) => {
    if (info.auth > 2) {
        elements.screen.classList.remove("hidden");
        elements.data.classList.remove("hidden");
        refreshData();
    } else createToast(`You do not have permission to do that.`);
};

// document.onkeydown = (e) => {
//     if (e.key === "Tab") {
//         if (info.auth > 2) {
//             elements.screen.classList.remove("hidden");
//             elements.data.classList.remove("hidden");
//             refreshData();
//         } else createToast(`You do not have permission to do that.`);
//     };
// };

ws.onopen = () => wsOpen();
ws.onmessage = (e, isBinary) => wsMessage(e, isBinary);
ws.onclose = (e) => wsClose(e);

eUpdate();