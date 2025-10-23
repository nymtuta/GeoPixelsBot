// ==UserScript==
// @name         GhostPixel Bot
// @namespace    https://github.com/nymtuta
// @version      0.3.2
// @description  A bot to place pixels from the ghost image on https://geopixels.net
// @author       nymtuta
// @match        https://*.geopixels.net/*
// @updateURL    https://github.com/nymtuta/GeoPixelsBot/raw/refs/heads/main/ghostBot.user.js
// @downloadURL  https://github.com/nymtuta/GeoPixelsBot/raw/refs/heads/main/ghostBot.user.js
// @homepage     https://github.com/nymtuta/GeoPixelsBot
// @icon         https://raw.githubusercontent.com/nymtuta/GeoPixelsBot/refs/heads/main/img/icon.png
// @license      GPL-3.0
// @grant        unsafeWindow
// ==/UserScript==

//#region Utils
Number.prototype.iToH = function () {
	return this.toString(16).padStart(2, "0");
};
String.prototype.hToI = function () {
	return parseInt(this, 16);
};

String.prototype.toFullHex = function () {
	let h = this.toLowerCase();
	if (!h.startsWith("#")) h = `#${h}`;
	if (h.length === 4 || h.length === 5) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
	if (h.length === 7) h += "ff";
	return h;
};

class Color {
	constructor(arg = {}) {
		if (typeof arg === "string") return this.constructorFromHex(arg);
		this.r = arg.r;
		this.g = arg.g;
		this.b = arg.b;
		this.a = arg.a == undefined || arg.a == null ? 255 : arg.a;
	}

	constructorFromHex(hex) {
		hex = hex.toFullHex();
		var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!r) throw new Error("Invalid hex color: " + hex);
		this.r = r[1].hToI();
		this.g = r[2].hToI();
		this.b = r[3].hToI();
		this.a = r[4].hToI();
	}

	rgbaString = () => `rgba(${this.r},${this.g},${this.b},${this.a})`;

	hex = () => "#" + this.r.iToH() + this.g.iToH() + this.b.iToH() + this.a.iToH();

	websiteId = () => (this.a == 0 ? -1 : (this.r << 16) + (this.g << 8) + this.b);

	// compare the colors
	valueOf = this.websiteId; //seems to be the convention
	val = this.valueOf; // will use that because is short
}

const pixelToGridCoord = (i, topLeft, size) => ({
	x: topLeft.x + (i % size.width),
	y: topLeft.y - Math.floor(i / size.width),
});

function getAllCoordsBetween(a, b) {
	const coords = [];
	for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++)
		for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) coords.push({ x, y });
	return coords;
}

const LOG_LEVELS = {
	error: { label: "ERR", color: "red" },
	info: { label: "INF", color: "lime" },
	warn: { label: "WRN", color: "yellow" },
	debug: { label: "DBG", color: "cyan" },
};

function log(lvl, ...args) {
	console.log(
		`%c[ghostBot] %c[${lvl.label}]`,
		"color: rebeccapurple;",
		`color:${lvl.color};`,
		...args
	);
}

class ImageData {
	constructor(imageData, topLeft, size) {
		this.data = imageData.map((d) => {
			const { i, r, g, b, a } = d;
			return {
				i,
				gridCoord: pixelToGridCoord(i, topLeft, size),
				color: new Color({ r, g, b, a }),
			};
		});
	}
}

FREE_COLORS = [
	"#FFFFFF",
	"#FFCA3A",
	"#FF595E",
	"#F3BBC2",
	"#BD637D",
	"#6A4C93",
	"#A8D0DC",
	"#1A535C",
	"#1982C4",
	"#8AC926",
	"#6B4226",
	"#CFD078",
	"#8B1D24",
	"#C49A6C",
	"#000000",
	"#00000000",
].map((c) => new Color(c));

function withErrorHandling(asyncFn) {
	return async function (...args) {
		try {
			return await asyncFn(...args);
		} catch (e) {
			log(LOG_LEVELS.error, e.message);
		}
	};
}
//#endregion

(function () {
	const usw = unsafeWindow;
	let ghostPixelData;
	let ignoredColors = new Set();
	const GOOGLE_CLIENT_ID = document.getElementById("g_id_onload").getAttribute("data-client_id");

	async function tryRelog() {
		tokenUser = "";

		log(LOG_LEVELS.info, "attempting AutoLogin");
		await usw.tryAutoLogin();

		if (!tokenUser.length) {
			log(LOG_LEVELS.info, "AutoLogin failed, attempting relog with google");
			await new Promise((resolve) => {
				google.accounts.id.initialize({
					client_id: GOOGLE_CLIENT_ID,
					callback: async (e) => {
						const r = await fetch("/auth/google", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ token: e.credential }),
						});
						if (!r.ok) return log(LOG_LEVELS.info, "Google authentication failed");
						const data = await r.json();
						await logIn(data);

						resolve();
					},
					auto_select: true,
					context: "signin",
				});

				google.accounts.id.prompt();
			});
		}

		log(LOG_LEVELS.info, `Relog ${tokenUser.length ? "successful" : "failed"}`);
		return !!tokenUser.length;
	}
	tryRelog = withErrorHandling(tryRelog);

	function getGhostImageData() {
		if (!ghostImage || !ghostImageOriginalData || !ghostImageTopLeft) return null;

		const ghostImageData = [];
		for (let i = 0; i < ghostImageOriginalData.data.length; i += 4) {
			const r = ghostImageOriginalData.data[i];
			const g = ghostImageOriginalData.data[i + 1];
			const b = ghostImageOriginalData.data[i + 2];
			const a = ghostImageOriginalData.data[i + 3];
			ghostImageData.push({ i: i / 4, r, g, b, a });
		}

		return new ImageData(
			ghostImageData,
			{ x: ghostImageTopLeft.gridX, y: ghostImageTopLeft.gridY },
			ghostImage
		);
	}

	Array.prototype.orderGhostPixels = function () {
		const freqMap = new Map();
		this.forEach((pixel) => {
			const val = pixel.color.val();
			freqMap.set(val, (freqMap.get(val) || 0) + 1);
		});
		return this.sort((a, b) => {
			const aFreq = freqMap.get(a.color.val());
			const bFreq = freqMap.get(b.color.val());
			return aFreq - bFreq;
		});
	};

	function setGhostPixelData() {
		ghostPixelData = getGhostImageData().data.filter((d) => {
			return (
				(usw.ghostBot.placeTransparentGhostPixels || d.color.a > 0) &&
				(usw.ghostBot.placeFreeColors ||
					!FREE_COLORS.map((c) => c.val()).includes(d.color.val())) &&
				Colors.map((c) => new Color(c).val()).includes(d.color.val()) &&
				!ignoredColors.has(d.color.val())
			);
		});
	}

	function getPixelsToPlace() {
		if (!ghostPixelData) setGhostPixelData();
		return ghostPixelData.orderGhostPixels().filter((d) => {
			const placedPixel = placedPixels.get(`${d.gridCoord.x},${d.gridCoord.y}`);
			return !placedPixel || new Color(placedPixel.color).val() !== d.color.val();
		});
	}

	async function sendPixels(pixels) {
		const r = await fetch("https://geopixels.net/PlacePixel", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				Token: tokenUser,
				Subject: subject,
				UserId: userID,
				Pixels: pixels.map((c) => ({ ...c, UserId: userID })),
			}),
		});
		if (!r.ok) {
			log(LOG_LEVELS.warn, "Failed to place pixels. : " + (await r.text()));
			if (r.status == 401 && (await tryRelog())) await sendPixels(pixels);
		} else log(LOG_LEVELS.info, `Placed ${pixels.length} pixels!`);
	}
	sendPixels = withErrorHandling(sendPixels);

	let stopWhileLoop = false;
	let promiseResolve;

	async function startGhostBot() {
		if (!ghostImage || !ghostImageOriginalData || !ghostImageTopLeft) {
			log(LOG_LEVELS.warn, "Ghost image not loaded.");
			return;
		}
		stopWhileLoop = false;
		while (!stopWhileLoop) {
			isPageVisible = true;
			await synchronize("full");
			const pixelsToPlace = getPixelsToPlace();
			if (pixelsToPlace.length === 0) {
				log(LOG_LEVELS.info, "All pixels are correctly placed.");
				break;
			}
			const pixelsThisRequest = pixelsToPlace.slice(0, currentEnergy);
			log(LOG_LEVELS.info, `Placing ${pixelsThisRequest.length}/${pixelsToPlace.length} pixels...`);

			await sendPixels(
				pixelsThisRequest.map((d) => {
					return {
						GridX: d.gridCoord.x,
						GridY: d.gridCoord.y,
						Color: d.color.websiteId(),
					};
				})
			);

			if (!tokenUser) {
				log(LOG_LEVELS.warn, "logged out => stopping the bot");
				break;
			}
			if (pixelsToPlace.length === pixelsThisRequest.length) {
				log(LOG_LEVELS.info, "All pixels are correctly placed.");
				break;
			}

			/* isPageVisible = !document.hidden; */
			await new Promise((resolve) => {
				promiseResolve = resolve;
				setTimeout(
					resolve,
					(maxEnergy > pixelsToPlace - maxEnergy ? pixelsToPlace - maxEnergy : maxEnergy - 2) *
						energyRate *
						1000
				);
			});
		}
	}
	startGhostBot = withErrorHandling(startGhostBot);

	usw.ghostBot = {
		placeTransparentGhostPixels: false,
		placeFreeColors: true,
		ignoreColors: withErrorHandling((input, sep = ",") => {
			if (!Array.isArray(input)) input = input.split(sep);
			ignoredColors = new Set(input.map((c) => new Color(c).val()));
			log(LOG_LEVELS.info, "New ignored colors :", ignoredColors);
		}),
		start: () => startGhostBot(),
		stop: () => {
			stopWhileLoop = true;
			promiseResolve?.();
			log(LOG_LEVELS.info, "Ghost bot stopped");
		},
		reload: () => setGhostPixelData(),
	};

	log(
		LOG_LEVELS.info,
		"GhostPixel Bot loaded. Use ghostBot.start() to start and ghostBot.stop() to stop."
	);
})();
