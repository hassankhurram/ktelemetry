import { SlackBot } from "./slackbot.js";


export function getUserIp(req) {
  try {
    // Extract IP from x-forwarded-for header or fallback to remoteAddress
    const userIpStr = (
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      ""
    )
      .toString()
      .trim();
    console.log("userIpStr: ", userIpStr);

    // If there are multiple IPs in x-forwarded-for, take the first one
    const firstIp = userIpStr.split(",")[0].trim();

    // extract ipv from the firstip string
    const ipv4 = firstIp.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
    // Handle IPv6 and IPv4 addresses correctly
    let userIp;
    if ((!ipv4 || ipv4.length == 0) && firstIp.includes(":")) {
      // IPv6 address (with or without port)
      const ipv6Parts = firstIp.split(":");

      // Check if the address contains more than 3 parts (it's likely a full IPv6)
      if (ipv6Parts.length > 3) {
        // If it has a port, it'll be at the end after the last ':'
        const ipv6WithoutPort = firstIp.includes("]")
          ? firstIp.split("]")[0] + "]"
          : firstIp.split(":").slice(0, -1).join(":");
        userIp = ipv6WithoutPort;
      } else {
        // Handle IPv4-mapped IPv6 or IPv4 with port in the format "192.168.0.1:8080"
        userIp = firstIp.split(":")[0];
      }
    } else {
      // IPv4 address (with or without port)
      userIp = ipv4[0];
    }

    // Log the IP and URL
    // SlackBot.sendMessage(`IP: ${userIp} | Url: ${req.url}`);

    // Attach to req object
    req.user_ip = userIp;

    return userIp;
  } catch (error) {
    SlackBot.sendMessage(`Error in getUserIp: ${error.message}`);
    console.error(error);
    return null;
  }
}

export function convertTimestampToMicroseconds(timestamp) {
  // Convert nanoseconds to microseconds
  return Math.floor(timestamp / 1000);
}

export function formatTimestamp(isoTimestamp) {
  // Create a Date object from the ISO 8601 string
  const date = new Date(isoTimestamp);

  // Extract date components
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getUTCFullYear();

  // Extract time components
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  // Combine into the desired format
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} UTC`;
}

export function formatMilliseconds(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  ms %= 1000 * 60 * 60;

  const minutes = Math.floor(ms / (1000 * 60));
  ms %= 1000 * 60;

  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  if (milliseconds > 0) parts.push(`${milliseconds.toFixed(2)}ms`);

  return parts.join(" ");
}

export function replaceEmptyObjectsWithNull(obj) {
  // Check if the input is an object and not null
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          if (Object.keys(obj[key]).length === 0) {
            // Set to null if the object is empty
            obj[key] = null;
          } else {
            // Recursively process nested objects
            replaceEmptyObjectsWithNull(obj[key]);
          }
        }
      }
    }
  } else if (Array.isArray(obj)) {
    // If the input is an array, iterate through each element
    obj.forEach((item, index) => {
      if (typeof item === "object" && item !== null) {
        if (Object.keys(item).length === 0) {
          obj[index] = null;
        } else {
          replaceEmptyObjectsWithNull(item);
        }
      }
    });
  }
  return obj;
}
