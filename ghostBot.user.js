// ==UserScript==
// @name         GhostPixel Bot
// @namespace    https://github.com/nymtuta
// @version      0.0.1
// @description  A bot to place pixels from the ghost image on https://geopixels.net
// @author       nymtuta
// @match        https://geopixels.net/*
// @updateURL    https://github.com/nymtuta/GeoPixelsBot/raw/refs/heads/main/ghostBot.js
// @downloadURL  https://github.com/nymtuta/GeoPixelsBot/raw/refs/heads/main/ghostBot.js
// @homepage     https://github.com/nymtuta/GeoPixelsBot
// @icon         https://raw.githubusercontent.com/nymtuta/GeoPixelsBot/refs/heads/main/img/icon.png
// @license      GPL-3.0
// @grant        unsafeWindow
// ==/UserScript==

(function () {
	const placeTransparentGhostPixels = false;

	const cToHex = (c) => c.toString(16).padStart(2, "0");

	function HexToInt(hex) {
		return hex.slice(7) === "00" ? -1 : parseInt(hex.slice(1, 7), 16);
	}

	const ghostImagePixelToGridCoord = (pixel) => ({
		x: ghostImageTopLeft.gridX + (pixel.i % ghostImage.width),
		y: ghostImageTopLeft.gridY - Math.floor(pixel.i / ghostImage.width),
	});

	String.prototype.toFullHex = function () {
		let h = this.toLowerCase();
		if (h.length === 4 || h.length === 5) h = "#" + [...h.slice(1)].map((c) => c + c).join("");
		if (h.length === 7) h += "ff";
		return h;
	};

	function getGhostImageData() {
		if (!ghostImage || !ghostImageOriginalData || !ghostImageTopLeft) return null;

		const ghostImageData = [];
		for (let i = 0; i < ghostImageOriginalData.data.length; i += 4) {
			const r = ghostImageOriginalData.data[i];
			const g = ghostImageOriginalData.data[i + 1];
			const b = ghostImageOriginalData.data[i + 2];
			const a = ghostImageOriginalData.data[i + 3];
			ghostImageData.push({
				i: i / 4,
				r,
				g,
				b,
				a,
				hex: `#${cToHex(r)}${cToHex(g)}${cToHex(b)}${cToHex(a)}`,
			});
		}
		return ghostImageData;
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
		console.log(r.ok ? "Placed pixels!" : "Failed to place pixels. : " + (await r.text()));
	}

	function getPixelsToPlace() {
		return getGhostImageData().filter((d) => {
			const gridCoord = ghostImagePixelToGridCoord(d);
			const placedPixel = placedPixels.get(`${gridCoord.x},${gridCoord.y}`);
			return (
				(placeTransparentGhostPixels || d.a > 0) &&
				(!placedPixel || placedPixel.color.toFullHex() !== d.hex) &&
				Colors.findIndex((c) => c.toFullHex() === d.hex) !== -1
			);
		});
	}

	let stopWhileLoop = false;

	unsafeWindow.startGhostBot = async function () {
		if (!ghostImage || !ghostImageOriginalData || !ghostImageTopLeft) {
			console.log("Ghost image not loaded.");
			return;
		}
		stopWhileLoop = false;
		while (!stopWhileLoop) {
			isPageVisible = true;
			await synchronize("full");
			const pixelsToPlace = getPixelsToPlace();
			if (pixelsToPlace.length === 0) {
				console.log("All pixels are correctly placed.");
				break;
			}
			const pixelsThisRequest = pixelsToPlace.slice(0, currentEnergy);
			console.log(`Placing ${pixelsThisRequest.length}/${pixelsToPlace.length} pixels...`);

			sendPixels(
				pixelsThisRequest.map((d) => {
					const gridCoord = ghostImagePixelToGridCoord(d);
					return {
						GridX: gridCoord.x,
						GridY: gridCoord.y,
						Color: HexToInt(d.hex),
					};
				})
			);

			/* isPageVisible = !document.hidden; */
			await new Promise((resolve) => setTimeout(resolve, (maxEnergy - 2) * energyRate * 1000));
		}
	};

	unsafeWindow.stopGhostBot = function () {
		stopWhileLoop = true;
	};
})();
