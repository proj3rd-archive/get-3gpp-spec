#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const basic_ftp_1 = require("basic-ftp");
const path_1 = require("path");
const process_1 = require("process");
const lib_1 = require("./lib");
const WILD_CARD = "*";
if (require.main === module) {
    const [, , spec, rel, quarter] = process_1.argv;
    cli(spec, rel, quarter);
}
function cli(spec, rel, quarter) {
    return __awaiter(this, void 0, void 0, function* () {
        let client;
        let latest;
        (0, lib_1.getSpec)(spec, rel, quarter)
            .then((fileInfoList) => {
            if (rel === WILD_CARD || quarter === WILD_CARD) {
                console.table(fileInfoList, ["path", "name", "date", "size"]);
                return;
            }
            latest = fileInfoList[0];
            if (!latest) {
                throw Error("The requested spec not found");
            }
            client = new basic_ftp_1.Client();
            return client.access({ host: lib_1.HOST });
        })
            .then(() => {
            if (!client) {
                return;
            }
            const { path, name } = latest;
            const dest = (0, path_1.resolve)((0, process_1.cwd)(), name);
            console.log(`Downloading the requested spec to ${dest}...`);
            return client.downloadTo(dest, `${path}/${name}`);
        })
            .then(() => {
            console.log("Done");
        })
            .catch((reason) => {
            console.error(reason);
        })
            .finally(() => client && client.close());
    });
}
/**
 * Get a release from version strnig
 * @param version String in a form of xyz or uvwxyz
 * @returns Release
 */
function getRelease(version) {
    if (version.length === 6) {
        return Number(version.substring(0, 2));
    }
    const map = Object.fromEntries("123456789abcdefghijklmnopqrstuvwxyz"
        .split("")
        .map((char, index) => [char, index + 1]));
    return map[version[0]];
}
/**
 * Get a series number from spec string
 * @param spec String in a form of ab.cde[-f]
 * @returns Series number (zero padded, if required)
 */
function getSeries(spec) {
    const indexDot = spec.indexOf(".");
    if (indexDot === -1) {
        throw Error("Spec must be in a form of ab.cde[-f]");
    }
    return spec.substring(0, indexDot);
}
/**
 * Parse a date string
 * @param date String in a form of `MM-DD-YY HH:mm(AM|PM)`
 * @returns Date object
 */
function parseDate(date) {
    const [YYMMDD, hhmmampm] = date.split(" ");
    const [MM, DD, YY] = YYMMDD.split("-").map(Number);
    const year = YY >= 98 ? 1900 + YY : 2000 + YY;
    const [hh, mm] = hhmmampm
        .substring(0, hhmmampm.length - 2)
        .split(":")
        .map(Number);
    const ampm = hhmmampm.substring(hhmmampm.length - 2);
    const hour = ampm === "PM" ? hh + 12 : hh;
    return new Date(year, MM - 1, DD, hour, mm);
}
//# sourceMappingURL=cli.js.map