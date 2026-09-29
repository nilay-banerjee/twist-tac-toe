import { USERNAME_MAX_LENGTH } from "../../../common/constants"

const STORAGE_KEY = "t3-username"

const ADJECTIVES = [
    "Sneaky",
    "Cosmic",
    "Fuzzy",
    "Brave",
    "Sleepy",
    "Wobbly",
    "Sly",
    "Mighty",
    "Quiet",
    "Zesty",
    "Grumpy",
    "Jolly",
    "Swift",
    "Lucky",
    "Clever",
    "Spicy",
    "Frosty",
    "Dizzy",
    "Bold",
    "Witty",
    "Nimble",
    "Rusty",
    "Shiny",
    "Gentle",
    "Chaotic",
    "Salty",
    "Sunny",
    "Tiny",
    "Vivid",
    "Wily",
]

const NOUNS = [
    "Otter",
    "Waffle",
    "Falcon",
    "Pickle",
    "Badger",
    "Comet",
    "Panda",
    "Taco",
    "Walrus",
    "Raven",
    "Muffin",
    "Gecko",
    "Yeti",
    "Noodle",
    "Lynx",
    "Pretzel",
    "Koala",
    "Nebula",
    "Ferret",
    "Dumpling",
    "Moose",
    "Pixel",
    "Toucan",
    "Bagel",
    "Hedgehog",
    "Mango",
    "Squid",
    "Wombat",
    "Puffin",
    "Kiwi",
]

function pick(words: string[]) {
    return words[Math.floor(Math.random() * words.length)]
}

export function randomUsername() {
    return pick(ADJECTIVES) + pick(NOUNS)
}

export function cleanUsername(name: string) {
    return name.trim().slice(0, USERNAME_MAX_LENGTH)
}

export function loadUsername() {
    try {
        const saved = cleanUsername(localStorage.getItem(STORAGE_KEY) ?? "")
        if (saved) return saved
    } catch {
        // Storage can be blocked (private mode); a fresh name still works.
    }
    return randomUsername()
}

export function saveUsername(name: string) {
    try {
        localStorage.setItem(STORAGE_KEY, name)
    } catch {
        // Not persisting is fine; the name still applies for this visit.
    }
}
