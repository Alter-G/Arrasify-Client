// const homeAddress = window.location.href
// const homeAddress = "arrasify.onrender.com/";
const homeAddress = "arrasify.alter-g.workers.dev/";
// const homeAddress = "127.0.0.1:8787/";
const ws = new WebSocket(`wss://${homeAddress}`);

let settings = {
    allow_pings: true,
    dark_theme: true
};

let info = {
    timeout: 0,
    channel: "???"
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

let dragMod = false;
let modLocation = {
    x: 0,
    y: 0
}

let id = ""; // Tells you what account you are. Is also the part after the hashtag of guest usernames
let sessionID = "-"; // Super important. Do NOT give this away, or your account will be temporarily hijacked
let autoScroll = true;
let lastScrollY = 0;

// Text-related things
let messageReplyID = "-"; // - for none
let messageReplyDM = false;

// Upload-related things
let uploadFile = undefined;
let uploadMime = "application/octet-stream";
let nextUpload = undefined;

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
        "spectator": "./emotes/spectator.png",
        "basic": "./emotes/basic.png",
        "booster": "./emotes/booster.png",
        "ranger": "./emotes/ranger.png",
        "valrayvn": "./emotes/valrayvn.jpg"
    },
    eVerify: {
        // Verify
        "verifyguest": "./emotes/verifyguest.png",
        "verifyalt": "./emotes/verifyalt.png",
        "verifydirector": "./emotes/verifydirector.png",
        "verifytrial": "./emotes/verifytrial.png",
        "verifymanager": "./emotes/verifymanager.png",
        "verifydev": "./emotes/verifydev.png",
        "verifytrash": "./emotes/verifytrash.png",
        "verifyyoutuber": "./emotes/verifyyoutuber.png",
        "verifymusician": "./emotes/verifymusician.png",
        "verifyartist": "./emotes/verifyartist.png",
        "verifybongis": "./emotes/verifybongis.png",
        "verifyolddev": "./emotes/verifyolddev.png"
    },
    eTrust: {
        // Trust
        "extremelynottrust": "./emotes/extremelynottrust.png",
        "nottrust": "./emotes/nottrust.png",
        "maybetrust": "./emotes/maybetrust.png",
        "yestrust": "./emotes/yestrust.png",
        "probablytrust": "./emotes/probablytrust.png",
        "supertrust": "./emotes/supertrust.png",
        "eviljinn": "./emotes/eviljinn.png",
        "deadchat": "./emotes/deadchat.png"
    },
    eDeltarune: {
        // Deltarune
        "mlg": "./emotes/mlg.png",
        "ralsei": "./emotes/ralsei.png",
        "determination": "./emotes/determination.png",
        "jaorange": "./emotes/jaorange.png",
        "justice": "./emotes/justice.png",
        "kindness": "./emotes/kindness.png",
        "patience": "./emotes/patience.png",
        "integrity": "./emotes/integrity.png",
        "perseverence": "./emotes/perseverence.png"
    },
    eTTF: {
        // TTF
        "ttfidle": "./emotes/ttfidle.gif",
        "ttfseizure": "./emotes/ttfseizure.gif",
        "ttfspin": "./emotes/ttfspin.gif"
    },
    eGeneral: {
        // General
        "skull": "./emotes/skull.png",
        "pepe": "./emotes/pepe.png",
        "troll": "./emotes/troll.png"
    },
    eMemes: {
        // Memes
        "smart": "./emotes/smart.gif",
        "clips": "./emotes/clips.gif",
        "bird": "./emotes/bird.gif",
        "yippe": "./emotes/yippe.gif",
        "nerd": "./emotes/nerd.gif",
        "duck": "./emotes/duck.gif",
        "bird": "./emotes/bird.gif",
        "badapple": "./emotes/badapple.gif",
        "idk": "./emotes/idk.gif"
    },
    eCommunity: {
        "dkg": "./emotes/dkg.png",
        "peiple": "./emotes/peiple.jfif"
    }
};

const allEmotes = { ...emotes.eDiep, ...emotes.eVerify, ...emotes.eTrust, ...emotes.eDeltarune, ...emotes.eTTF, ...emotes.eGeneral, ...emotes.eMemes, ...emotes.eCommunity };

const elements = {
    screen: document.querySelector("#screen"), // The darkening effect
    // Header Bars
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
    eTTF: document.querySelector("#eTTF"),
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
    bookRules: document.querySelector("#bookRules"),
    bookChangelog: document.querySelector("#bookChangelog"),
    bookAdmins: document.querySelector("#bookAdmins"),
    bookSupport: document.querySelector("#bookSupport"),
    bookCommands: document.querySelector("#bookCommands"),
    // Content
    bookRulesContent: document.querySelector("#bookRulesContent"),
    bookChangelogContent: document.querySelector("#bookChangelogContent"),
    bookAdminsContent: document.querySelector("#bookAdminsContent"),
    bookSupportContent: document.querySelector("#bookSupportContent"),
    bookCommandsContent: document.querySelector("#bookCommandsContent"),
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

const messageCreateUserElement = (user, pfp, verified, neo, timestamp, message, aID, id, dm, canReply) => {
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
    }

    const userName = document.createElement("p");
    userName.innerText = `${dm ? "[Direct] " : ""}${user}`;
    userName.className = `user-name message-${neo}`;

    userInfo.appendChild(userPfp);
    userInfo.appendChild(userName);
    if (verified) {
        let verifiedSymbol = document.createElement("i");
        verifiedSymbol.className = "bi bi-check-circle user-verified";
        userInfo.appendChild(verifiedSymbol);
    };
    userInfo.onclick = (e) => { createToast("You can't view profiles yet."); };

    // Extra buttons and timestamp
    const time = document.createElement("p");
    let dateTime = new Date(timestamp);
    time.innerText = `${dateTime.getHours() % 12 < 10 ? "0" : ""}${dateTime.getHours() % 12}:${dateTime.getMinutes() < 10 ? "0" : ""}${dateTime.getMinutes()} ${dateTime.getHours() < 12 ? "AM" : "PM"}`;

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

const messageCreateTextElement = (message, color) => {
    // Text
    const chatMessage = document.createElement("div");
    chatMessage.className = `chat-message message-${color}`;
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
        let reconstructed = [];
        let previousWasEmote = false;
        const emoteSplit = line.split(":");
        // Initial text
        // reconstructed.push(emoteSplit[0]);
        const pElement = document.createElement(`p`);
        pElement.textContent = emoteSplit[0];
        s.appendChild(pElement);
        for (let i = 1; i < emoteSplit.length; i++) { // Per emote
            // Check if it's an emoji
            if (Object.keys(emojis).includes(emoteSplit[i])) {
                previousWasEmote = true;
                // reconstructed.push(`<i class="${emojis[emoteSplit[i]]}"></i>`);
                const emojiElement = document.createElement(`i`);
                emojiElement.className = `${emojis[emoteSplit[i]]}`;
                s.appendChild(emojiElement);
            } else if (Object.keys(allEmotes).includes(emoteSplit[i])) { // Check if it's an emote
                previousWasEmote = true;
                // reconstructed.push(`<img class="chat-emote" src="${emotes[emoteSplit[i]]}">`);
                const emoteElement = document.createElement(`img`);
                emoteElement.className = `chat-emote`;
                emoteElement.src = `${allEmotes[emoteSplit[i]]}`;
                s.appendChild(emoteElement);
            } else if (i > 0 && !previousWasEmote) {
                previousWasEmote = false;
                // reconstructed.push(":" + emoteSplit[i]);
                const pElement = document.createElement(`p`);
                pElement.textContent = ":" + emoteSplit[i];
                if (emoteSplit[i - 1][emoteSplit[i - 1].length - 1] === " ") pElement.style.marginLeft = `4px`;
                s.appendChild(pElement);
            } else {
                previousWasEmote = false;
                // reconstructed.push(emoteSplit[i]);
                const pElement = document.createElement(`p`);
                pElement.textContent = emoteSplit[i];
                s.appendChild(pElement);
            };
            // p.appendChild(s);
        };
        // p.innerHTML = reconstructed.join("");
        // paragraphs.push(p);
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

const createMessageText = (user, pfp, verified, message, neo, color, timestamp, aID, id, reply, dm, canReply) => {
    if (message.toString() != "") {
        const messageElement = document.createElement("div");
        messageElement.className = `message${dm ? " dm" : ""}`;

        const replyText = document.createElement("p");
        replyText.className = "reply-text";
        if (reply != "-") replyText.innerText = reply;

        const chatUser = messageCreateUserElement(user, pfp, verified, neo, timestamp, message, aID, id, dm, canReply);
        // chatUser.querySelector(".bi-trash").onclick = () => messageElement.remove();
        const chatMessage = messageCreateTextElement(message, color);

        if (reply != "-") messageElement.appendChild(replyText);
        messageElement.appendChild(chatUser);
        // HR element to separate the sender from the message content
        messageElement.appendChild(document.createElement("hr"));
        messageElement.appendChild(chatMessage);

        elements.chatHistory.appendChild(messageElement);
        if (autoScroll) setTimeout(scrollChatHistory, 30);
    };
}

const createMessageUpload = (user, pfp, verified, file, neo, timestamp, aID, id) => {
    const messageElement = document.createElement("div");
    messageElement.className = "message";

    const chatUser = messageCreateUserElement(user, pfp, verified, neo, timestamp, "[Upload]", aID, id, false, true);
    // chatUser.querySelector(".bi-trash").onclick = () => messageElement.remove();
    const chatImage = messageCreateImageElement(file);

    messageElement.appendChild(chatUser);
    // HR element to separate the sender from the message content
    messageElement.appendChild(document.createElement("hr"));
    messageElement.appendChild(chatImage);

    elements.chatHistory.appendChild(messageElement);
    if (autoScroll) setTimeout(scrollChatHistory, 30);
};

const createMessageSimple = (message, timestamp, color) => {
    const messageElement = document.createElement("div");
    messageElement.className = `message`;

    let dateTime = new Date(timestamp);
    const messageWithTime = `${dateTime.getHours() % 12 < 10 ? "0" : ""}${dateTime.getHours() % 12}:${dateTime.getMinutes() < 10 ? "0" : ""}${dateTime.getMinutes()} ${dateTime.getHours() < 12 ? "AM" : "PM"} ${message}`;

    const chatMessage = messageCreateTextElement(messageWithTime, color);
    messageElement.appendChild(chatMessage);

    elements.chatHistory.appendChild(messageElement);
    if (autoScroll) setTimeout(scrollChatHistory, 30);
    return messageElement;
};

const createUserInList = (id, aID, name, bio, pfp, verified, neo) => {
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
    userName.className = `user-name message-${neo}`;
    userName.innerText = name;

    user.appendChild(userPfp);
    user.appendChild(userName);
    if (verified) user.innerHTML += `<i class="bi bi-check-circle user-verified"></i>`;
    elements.users.appendChild(user);
    return user;
};

const listAllUsers = () => {
    elements.users.innerHTML = ``;
    if (collectedUsers.friends.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Friends</h2>`;
        collectedUsers.friends.forEach((friend) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(friend.id, friend.aID, friend.name, friend.bio, friend.pfp, true, friend.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.developers.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Developers</h2>`;
        collectedUsers.developers.forEach((developer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(developer.id, developer.aID, developer.name, developer.bio, developer.pfp, true, developer.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.admins.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Admins</h2>`;
        collectedUsers.admins.forEach((admin) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(admin.id, admin.aID, admin.name, admin.bio, admin.pfp, true, admin.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.overseers.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Overseers</h2>`;
        collectedUsers.overseers.forEach((overseer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(overseer.id, overseer.aID, overseer.name, overseer.bio, overseer.pfp, true, overseer.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.underseers.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Underseers</h2>`;
        collectedUsers.underseers.forEach((underseer) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(underseer.id, underseer.aID, underseer.name, underseer.bio, underseer.pfp, true, underseer.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.helpers.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Helpers</h2>`;
        collectedUsers.helpers.forEach((helper) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(helper.id, helper.aID, helper.name, helper.bio, helper.pfp, true, helper.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.users.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Users</h2>`;
        collectedUsers.users.forEach((user) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(user.id, user.aID, user.name, user.bio, user.pfp, true, user.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
        });
        elements.users.innerHTML += `<hr>`;
    };
    if (collectedUsers.guests.length > 0) {
        elements.users.innerHTML += `<h2 style="text-align: center; color: white; user-select: none;">Guests</h2>`;
        collectedUsers.guests.forEach((guest) => {
            // ID in this case is the actual instance ID (the thing guest names have after the hashtag)
            const userInList = createUserInList(guest.id, guest.aID, guest.name, guest.bio, guest.pfp, false, guest.neo);
            userInList.onclick = (e) => { createToast("You can't view profiles yet."); };
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

// GET and POST Requests
const postTokenAuth = async () => {
    try {
        const response = await fetch(`https://${homeAddress}auth`, {
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
        mime: uploadMime
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
    }, 30);
};

const wsMessage = (data, isBinary) => {
    let isBinaryTrue = isBinary || data.data instanceof ArrayBuffer || data.data instanceof Blob;
    if (!isBinaryTrue) {
        try {
            const message = JSON.parse(data.data.toString());
            switch (message.type) {
                case "text": {
                    createMessageText(
                        message.sender.name,
                        message.sender.pfp,
                        message.sender.aID != "-",
                        message.content,
                        message.neo,
                        message.color,
                        message.timestamp,
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
                    message.history.forEach((msg) => {
                        msg = JSON.parse(msg);
                        createMessageText(
                            msg.sender.name,
                            msg.sender.pfp,
                            msg.sender.aID != "-",
                            msg.content,
                            msg.neo,
                            msg.color,
                            msg.timestamp,
                            msg.aID,
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
        } catch (err) {
            console.error(`${err.name}: ${err.message}`);
        };
    } else {
        let imgblob;
        if (data.data instanceof ArrayBuffer) {
            imgblob = new Blob([data.data], { mime: nextUpload.mime });
        } else {
            imgblob = data.data;
        };
        createMessageUpload(nextUpload.sender.name, nextUpload.sender.pfp, nextUpload.sender.aID != "-", imgblob, nextUpload.neo, nextUpload.timestamp, nextUpload.sender.aID, nextUpload.id);
    };
};

const wsClose = (e) => {
    elements.disconnect.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
    elements.disconnectCode.innerText = `Exit code: ${e.code ? e.code : "No code given."}`;
    elements.disconnectReason.innerText = `Reason: ${e.reason ? e.reason : "No reason given."}`;
    createToast(`WebSocket has closed! ${e.code ? e.code : "No code given"}: ${e.reason ? e.reason : "No reason given."}`);
    console.error(`WebSocket has closed! ${e.code ? e.code : "No code given"}: ${e.reason ? e.reason : "No reason given."}`);
};

// e functions are for events
const eVisitAsGuest = (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.auth.classList.add("hidden");
    elements.users.classList.remove("hidden");
    elements.viewport.classList.remove("hidden");
    elements.backToAuth.classList.remove("hidden");
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
    ws.send(payloadUploadRequest());
    const reader = new FileReader();
    reader.readAsArrayBuffer(uploadFile);
    reader.onload = () => {
        ws.send(reader.result);
    };
};

const eInitiateReply = (user, message, id, dm) => {
    elements.chatReply.classList.remove("hidden");
    elements.replyUser.innerText = `Replying to: ${user}`;
    let sampleSize = 80;
    let sample = message.slice(0, sampleSize);
    if (sample.length == sampleSize) sample += "-...";
    elements.replyContent.innerText = `${sample}`;
    messageReplyID = id;
    messageReplyDM = dm;
    if (autoScroll) setTimeout(scrollChatHistory, 30);
};

const eUpdate = () => {
    let displayTime = Math.trunc(info.timeout / 1000) + 1;
    elements.chatInfo.innerText = info.timeout < 1 ? "No status." : `Slowmode: please wait ${displayTime}s...`;
    // elements.barMessage.disabled = info.timeout > 0;
    elements.barMessage.placeholder = info.timeout > 0 ? `Please wait ${displayTime}s...` : "Enter your message to send here.";
    elements.chatChannel.innerText = `Channel: ${info.channel}`;
    let scrollLeniency = elements.chatHistory.clientHeight / 3;
    autoScroll = elements.chatHistory.scrollTop + scrollLeniency >= elements.chatHistory.scrollHeight - elements.chatHistory.clientHeight;
    if (!autoScroll) elements.scrollButton.classList.remove("invisible");
    else elements.scrollButton.classList.add("invisible");
    requestAnimationFrame(eUpdate);
};

const eAuthenticate = () => {
    postTokenAuth();
    elements.barToken.value = "";
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
    if (settings.allow_pings) elements.togglePings.className = "bi bi-bell header-icons";
    else elements.togglePings.className = "bi bi-bell-slash header-icons";
};

elements.toggleDark.onclick = () => {
    settings.dark_theme = !settings.dark_theme;
    if (settings.dark_theme) {
        elements.toggleDark.className = "bi bi-moon-stars-fill header-icons";
        document.body.classList.remove("theme-light");
        document.body.classList.add("theme-dark");
    } else {
        elements.toggleDark.className = "bi bi-sun-fill header-icons";
        document.body.classList.remove("theme-dark");
        document.body.classList.add("theme-light");
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
    if (info.timeout < 1) {
        eCreateMessage();
    } else {
        let displayTime = Math.trunc(info.timeout / 1000) + 1;
        createToast(`Please wait ${displayTime}s...`);
    };
};
elements.barMessage.onkeydown = (e) => {
    if (e.key == "Enter") {
        if (info.timeout < 1) {
            eCreateMessage();
        } else {
            let displayTime = Math.trunc(info.timeout / 1000) + 1;
            createToast(`Please wait ${displayTime}s...`);
        };
    };
};
elements.barMessage.onpaste = (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
            uploadFile = items[i].getAsFile();
            uploadMime = uploadFile.type;
            elements.imageConfirm.classList.remove("hidden");
            elements.screen.classList.remove("hidden");
            elements.barImage.value = "";
            elements.imageConfirmImage.src = URL.createObjectURL(uploadFile);
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

/* Emote onclicks */
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

/* Thank god thats over */
// /* Oh shi nvm its not lmao */

const createNewEmote = (emoteList, emoteKey) => {
    const emoteElement = document.createElement("img");
    emoteElement.className = "emote";
    emoteElement.src = allEmotes[emoteKey];
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

// /* Emote onclicks */
// // Diep.io / Arras.io
// elements.emoteSpectator.onclick = (e) => {
//     elements.barMessage.value += ":spectator:";
// };
// elements.emoteBasic.onclick = (e) => {
//     elements.barMessage.value += ":basic:";
// };
// elements.emoteBooster.onclick = (e) => {
//     elements.barMessage.value += ":booster:";
// };
// elements.emoteRanger.onclick = (e) => {
//     elements.barMessage.value += ":ranger:";
// };
// elements.emoteValrayvn.onclick = (e) => {
//     elements.barMessage.value += ":valrayvn:";
// };
// // Verify
// elements.emoteVerifyGuest.onclick = (e) => {
//     elements.barMessage.value += ":verifyguest:";
// };
// elements.emoteVerifyAlt.onclick = (e) => {
//     elements.barMessage.value += ":verifyalt:";
// };
// elements.emoteVerifyDirector.onclick = (e) => {
//     elements.barMessage.value += ":verifydirector:";
// };
// elements.emoteVerifyTrial.onclick = (e) => {
//     elements.barMessage.value += ":verifytrial:";
// };
// elements.emoteVerifyManager.onclick = (e) => {
//     elements.barMessage.value += ":verifymanager:";
// };
// elements.emoteVerifyDev.onclick = (e) => {
//     elements.barMessage.value += ":verifydev:";
// };
// elements.emoteVerifyTrash.onclick = (e) => {
//     elements.barMessage.value += ":verifytrash:";
// };
// elements.emoteVerifyYoutuber.onclick = (e) => {
//     elements.barMessage.value += ":verifyyoutuber:";
// };
// elements.emoteVerifyMusician.onclick = (e) => {
//     elements.barMessage.value += ":verifymusician:";
// };
// elements.emoteVerifyArtist.onclick = (e) => {
//     elements.barMessage.value += ":verifyartist:";
// };
// elements.emoteVerifyBongis.onclick = (e) => {
//     elements.barMessage.value += ":verifybongis:";
// };
// elements.emoteVerifyOldDev.onclick = (e) => {
//     elements.barMessage.value += ":verifyolddev:";
// };
// // Trust
// elements.emoteExtremelyNotTrust.onclick = (e) => {
//     elements.barMessage.value += ":extremelynottrust:";
// };
// elements.emoteNotTrust.onclick = (e) => {
//     elements.barMessage.value += ":nottrust:";
// };
// elements.emoteMaybeTrust.onclick = (e) => {
//     elements.barMessage.value += ":maybetrust:";
// };
// elements.emoteYesTrust.onclick = (e) => {
//     elements.barMessage.value += ":yestrust:";
// };
// elements.emoteProbablyTrust.onclick = (e) => {
//     elements.barMessage.value += ":probablytrust:";
// };
// elements.emoteSuperTrust.onclick = (e) => {
//     elements.barMessage.value += ":supertrust:";
// };
// // Deltarune
// elements.emoteMlg.onclick = (e) => {
//     elements.barMessage.value += ":mlg:";
// };
// elements.emoteRalsei.onclick = (e) => {
//     elements.barMessage.value += ":ralsei:";
// };
// // TTF
// elements.emoteTtfIdle.onclick = (e) => {
//     elements.barMessage.value += ":ttfidle:";
// };
// elements.emoteTtfSeizure.onclick = (e) => {
//     elements.barMessage.value += ":ttfseizure:";
// };
// elements.emoteTtfSpin.onclick = (e) => {
//     elements.barMessage.value += ":ttfspin:";
// };
// // Ripoffs / Bad
// elements.emoteBadSkull.onclick = (e) => {
//     elements.barMessage.value += ":badskull:";
// };
// elements.emoteBadPepe.onclick = (e) => {
//     elements.barMessage.value += ":badpepe:";
// };
// // Memes
// elements.emoteSmart.onclick = (e) => {
//     elements.barMessage.value += ":smart:";
// };
// elements.emoteClips.onclick = (e) => {
//     elements.barMessage.value += ":clips:";
// };
/* this took too long, and adding new emotes is going to be annoying lmao */

// Book
elements.helper.onclick = (e) => {
    elements.screen.classList.remove("hidden");
    elements.book.classList.remove("hidden");
};
elements.closeBook.onclick = (e) => {
    elements.screen.classList.add("hidden");
    elements.book.classList.add("hidden");
};
elements.bookRules.onclick = (e) => {
    // Tabs
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
    // Content
    elements.bookRulesContent.classList.remove("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
};
elements.bookChangelog.onclick = (e) => {
    // Tabs
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
    // Content
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.remove("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
};
elements.bookAdmins.onclick = (e) => {
    // Tabs
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
    // Content
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.remove("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.add("hidden");
};
elements.bookCommands.onclick = (e) => {
    // Tabs
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
    // Content
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.remove("hidden");
    elements.bookSupportContent.classList.add("hidden");
};
elements.bookSupport.onclick = (e) => {
    // Tabs
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
    // Content
    elements.bookRulesContent.classList.add("hidden");
    elements.bookChangelogContent.classList.add("hidden");
    elements.bookAdminsContent.classList.add("hidden");
    elements.bookCommandsContent.classList.add("hidden");
    elements.bookSupportContent.classList.remove("hidden");
};

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
        elements.imageConfirm.classList.remove("hidden");
        elements.screen.classList.remove("hidden");
        elements.barImage.value = "";
        elements.imageConfirmImage.src = URL.createObjectURL(uploadFile);
    };
};

elements.barClip.onclick = () => elements.barImage.click();
elements.barImage.onchange = () => {
    uploadFile = elements.barImage.files.item(0);
    uploadMime = uploadFile.type;
    elements.imageConfirm.classList.remove("hidden");
    elements.screen.classList.remove("hidden");
    elements.barImage.value = "";
    elements.imageConfirmImage.src = URL.createObjectURL(uploadFile);
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

ws.onopen = () => wsOpen();
ws.onmessage = (e, isBinary) => wsMessage(e, isBinary);
ws.onclose = (e) => wsClose(e);
ws.onerror = (e) => wsClose(e);

eUpdate();