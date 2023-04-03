#!/usr/bin/env node

import { Client } from "basic-ftp";
import { resolve } from "path";
import { argv, cwd } from "process";
import { HOST, getSpec } from "./lib";

const WILD_CARD = "*";

if (require.main === module) {
  const [, , spec, rel, quarter] = argv;
  cli(spec, rel, quarter);
}

async function cli(spec: string, rel: string, quarter: string) {
  let client: Client;
  let latest: { path: string; name: string; date: Date };
  getSpec(spec, rel, quarter)
    .then((fileInfoList) => {
      if (rel === WILD_CARD || quarter === WILD_CARD) {
        console.table(fileInfoList, ["path", "name", "date", "size"]);
        return;
      }
      latest = fileInfoList[0];
      if (!latest) {
        throw Error("The requested spec not found");
      }
      client = new Client();
      return client.access({ host: HOST });
    })
    .then(() => {
      if (!client) {
        return;
      }
      const { path, name } = latest;
      const dest = resolve(cwd(), name);
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
