#!/usr/bin/env node

import { Client } from "basic-ftp";
import { parse, resolve } from "path";
import { argv, cwd } from "process";

const WILD_CARD = "*";

if (require.main === module) {
  const [, , spec, rel, quarter] = argv;
  cli(spec, rel, quarter);
}

async function cli(spec: string, rel: string, quarter: string) {
  const HOST = "ftp.3gpp.org";
  const series = getSeries(spec);
  const path = `/Specs/archive/${series}_series/${spec}`;
  const client = new Client();
  client
    .access({
      host: HOST,
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
          const { name } = parse(fileInfo.name);
          const indexHyphen = name.lastIndexOf("-");
          if (indexHyphen === -1) {
            throw Error(
              "Spec must be in a form of AB.CDE[-F]-xyz or AB.CDE[-F]-uvwxyz"
            );
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
        .map((fileInfo) => ({
          ...fileInfo,
          date: parseDate(fileInfo.rawModifiedAt),
        }))
        .sort((a, b) => {
          return b.date.getTime() - a.date.getTime();
        });
    })
    .then((fileInfoList) => {
      if (rel === WILD_CARD) {
        console.log(JSON.stringify(fileInfoList, null, 2));
        return;
      }
      const latest = fileInfoList[0];
      if (!latest) {
        throw Error("The requested spec not found");
      }
      const dest = resolve(cwd(), latest.name);
      console.log(`Downloading the requested spec to ${dest}...`);
      return client.downloadTo(dest, `${path}/${latest.name}`);
    })
    .then(() => {
      console.log("Done");
    })
    .catch((reason) => {
      console.error(reason);
    })
    .finally(() => {
      client.close();
    });
}

/**
 * Get a release from version strnig
 * @param version String in a form of xyz or uvwxyz
 * @returns Release
 */
function getRelease(version: string) {
  if (version.length === 6) {
    return Number(version.substring(0, 2));
  }
  const map = Object.fromEntries(
    "123456789abcdefghijklmnopqrstuvwxyz"
      .split("")
      .map((char, index) => [char, index + 1])
  );
  return map[version[0]];
}

/**
 * Get a series number from spec string
 * @param spec String in a form of ab.cde[-f]
 * @returns Series number (zero padded, if required)
 */
function getSeries(spec: string) {
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
function parseDate(date: string) {
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
