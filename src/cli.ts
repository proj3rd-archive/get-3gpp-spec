import { Client } from "basic-ftp";
import { argv } from "process";

if (require.main === module) {
  const [, , spec, rel, quarter] = argv;
  cli(spec, rel, quarter);
}

async function cli(spec: string, rel: string, quarter: string) {
  const HOST = "ftp.3gpp.org";
  const client = new Client();
  await client.access({
    host: HOST,
  });

  const series = getSeries(spec);
  const path = `/Specs/archive/${series}_series/${spec}`;
  await client.cd(path);
  const fileInfoList = (await client.list()).map((fileInfo) => ({
    ...fileInfo,
    date: parseDate(fileInfo.rawModifiedAt),
  }));
  console.table(fileInfoList);
  client.close();
}

/**
 * Parse a date string
 * @param date String in a form of `MM-DD-YY HH:mm(AM|PM)`
 * @returns  Date object
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

function getSeries(spec: string) {
  const indexDot = spec.indexOf(".");
  if (indexDot === -1) {
    throw Error("Spec must be in a form of AB.CDE[-F]");
  }
  return spec.substring(0, indexDot);
}
