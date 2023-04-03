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
exports.getSpec = exports.HOST = void 0;
const basic_ftp_1 = require("basic-ftp");
const path_1 = require("path");
exports.HOST = "ftp.3gpp.org";
const WILD_CARD = "*";
function getSpec(spec, rel, quarter) {
    return __awaiter(this, void 0, void 0, function* () {
        const series = getSeries(spec);
        const path = `/Specs/archive/${series}_series/${spec}`;
        const client = new basic_ftp_1.Client();
        return client
            .access({
            host: exports.HOST,
        })
            .then(() => {
            return client.cd(path);
        })
            .then(() => {
            return client.list();
        })
            .then((fileInfoList) => {
            return fileInfoList
                .filter((fileInfo) => {
                // Check release verison
                const { name } = (0, path_1.parse)(fileInfo.name);
                const indexHyphen = name.lastIndexOf("-");
                if (indexHyphen === -1) {
                    throw Error("Spec must be in a form of AB.CDE[-F]-xyz or AB.CDE[-F]-uvwxyz");
                }
                const version = name.substring(indexHyphen + 1);
                const release = getRelease(version);
                if (rel !== WILD_CARD && release !== Number(rel)) {
                    return false;
                }
                // Check date
                if (quarter === WILD_CARD) {
                    return true;
                }
                const date = parseDate(fileInfo.rawModifiedAt).getTime();
                const [yy, mm] = quarter.split("-").map(Number);
                const dateQuarter = new Date(yy, mm - 1).getTime();
                const dateQuarterPlus3Months = new Date(yy, mm + 2).getTime();
                return date >= dateQuarter && date < dateQuarterPlus3Months;
            })
                .map((fileInfo) => (Object.assign(Object.assign({ path }, fileInfo), { date: parseDate(fileInfo.rawModifiedAt) })))
                .sort((a, b) => {
                return b.date.getTime() - a.date.getTime();
            });
        })
            .catch((reason) => Promise.reject(reason))
            .finally(() => client.close());
    });
}
exports.getSpec = getSpec;
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
//# sourceMappingURL=lib.js.map