import twit from "./mytwit";
import fs from "fs";
import { Observable, of, from } from "rxjs";
const fsp = fs.promises;

import UserIDObserver from "./UserIDObservable";
import HashtagObserver from "./HashtagObservable";

const uio = new UserIDObserver([
  // "764336026479235072",
  "1663143193",
  "145931392",
  "24871506",
  "47619730",
  "361098756",
  "148271173",
  "91053979"
]);

interface TweetData {
  created_at: string;
  id: number;
  id_str: string;
  text: string;
  user: { id: number; id_str: string; name: string; screen_name: string };
  entities: { hashtags: [{ indices: number; text: string }] };
  extended_tweet: { full_text: string };
  retweeted: boolean;
  lang: string;
}

var hashtagToIgnore: Array<string> = [
  "เดลินิวส์",
  "หน้า1เดลินิวส์",
  "เดลินิวส์อ่านต่อที่",
  "คมชัดลึก",
  "คมข่าวทั่วไทย",
  "คมชัดลึกกีฬา",
  "บันเทิงคมชัดลึก",
  "ลึกกว่าข่าว",
  "คมชัดลึกลึกกว่าข่าว",
  "INNNEWS",
  "INN",
  "SMSINN",
  "isranews",
  "สำนักข่าวอิศรา",
  "สำนัข่าวอิศรา",
  "สำนักข่าวอิสศรา",
  "บันเทิงไทย",
  "ข่าวบันเทิง",
  "ข่าวกีฬา",
  "siamrathonline",
  "PPTVHD36",
  "PPTVNews",
  "88uefa",
  "slotxo",
  "casa98",
  "แทงบอลออนไลน์",
  "คาสิโนออนไลน์",
  "Thairath",
  "kapook",
  "Sanook",
  "SanookHoroscope",
  "SanookMoney",
  "NEW18",
  "นิว18",
  "สยามรัฐ"
];
var freqHashtag = new Map();
var tempFreqHashtag = new Map();
var runningHashtag = new Map();
var trackHashtags = new Map<string, HashtagObserver>();

var thresholdTweetCount = 5;
var thresholdEndDay = 7;
var thresholdValidHashtag = 2;
var totalCollectedTweet = 0;

uio.tweet.subscribe((tweet: TweetData) => {
  console.log("user is streaming...");
  if (totalCollectedTweet !== 0 && totalCollectedTweet % thresholdEndDay == 0) {
    console.log("Here's freqHashtag\n");
    freqHashtag = Object.assign(tempFreqHashtag, freqHashtag);
    console.log(freqHashtag);
    checkHashtagToStopStream();
  }

  if (
    totalCollectedTweet !== 0 &&
    totalCollectedTweet % thresholdTweetCount == 0
  ) {
    console.log("Reached the threshold total tweets\n");
    // if collect tweet 5 times, check if can tracks some new hashtag
    checkValidHashtagToStream();
  }

  let isTweetValid = checkIfTweetValid(tweet);

  if (isTweetValid) {
    console.log("Hooray! Found some valid tweet.\n");
    // count collected hashtag, keep value in tempFreqHashtag
    countFreqHashtag(tweet);
    totalCollectedTweet += 1;
    console.log("Total tweets = %s\n", totalCollectedTweet);
  }

  //   // uio.stop();
});

function checkIfTweetValid(tweet: TweetData): boolean {
  let isTweetValid = false;
  let hasRunningHashtag = false;
  let hashtagListInEachTweet = tweet.entities.hashtags;

  hashtagListInEachTweet.forEach(element => {
    let textHashtag = element.text;
    // check if all of hashtag is not running
    if (runningHashtag.has(textHashtag)) {
      hasRunningHashtag = true;
    }
  });

  if (!hasRunningHashtag) {
    hashtagListInEachTweet.forEach(element => {
      let textHashtag = element.text;
      // check if at least hashtag not in hashtagToIgnore
      if (!hashtagToIgnore.some(x => x === textHashtag)) {
        isTweetValid = true;
      }
    });
  }

  return isTweetValid;
}

function checkIfTweetValidTracking(tweet: TweetData): boolean {
  let isTweetValid = false;
  let hashtagListInEachTweet = tweet.entities.hashtags;

  hashtagListInEachTweet.forEach(element => {
    let textHashtag = element.text;
    // check if at least one hashtag not in hashtagToIgnore
    if (!hashtagToIgnore.some(x => x === textHashtag)) {
      isTweetValid = true;
    }
  });

  return isTweetValid;
}

function countFreqHashtag(tweet: TweetData) {
  let textTweet = tweet.text.replace(/RT @[^\s]+/g, "");
  textTweet = textTweet.replace(/RT@[^\s]+/g, "");
  textTweet = textTweet.replace(/@[^\s]+/g, "");
  textTweet = textTweet.replace(
    /([^\S]|^)(((https?\:\/\/)|(www\.))(\S+))/gi,
    ""
  );
  console.log("Tweet Collected: ", textTweet);
  // console.log(tweet.entities.hashtags);
  // console.log("\n");

  let hashtags = tweet.entities.hashtags;

  hashtags.forEach(element => {
    let textHashtag = element.text;
    if (!hashtagToIgnore.some(x => x === textHashtag)) {
      if (tempFreqHashtag.has(textHashtag)) {
        tempFreqHashtag.get(textHashtag).count++;
      } else {
        tempFreqHashtag.set(textHashtag, { count: 1 });
      }
    }
  });

  console.log(tempFreqHashtag);
  // console.log("\n");
}

function getNumberOfCollectedHashtag(): number {
  let count = freqHashtag.size;
  return count;
}

function checkValidHashtagToStream() {
  // check tempFreqHashtag if some key has a value exceed 2, track it.
  tempFreqHashtag.forEach((value, key) => {
    if (value.count >= thresholdValidHashtag) {
      console.log("Valid hashtag is %s %s", key, value.count);

      // check if hashtag is not running
      if (!runningHashtag.has(key)) {
        console.log("Yeah! We have new hashtag to stream.");

        runningHashtag.set(key, 1); // set running 'flag = 1' to hashtag
        startStreamManager(key);
      }
    }
  });
}

function startStreamManager(key: string) {
  var htStartStream = streamNewHashtag(key);
  trackHashtags.set(key, htStartStream);
}

function stopStreamManager(key: string) {
  console.log("%s is going to disconnecting..", key);
  var htStopStream = trackHashtags.get(key);
  runningHashtag.delete(key);
  if (htStopStream !== undefined) {
    htStopStream.stop();
  }
}

function streamNewHashtag(key: string): HashtagObserver {
  console.log(runningHashtag);
  console.log("==============================================");
  let streamHt = new HashtagObserver(key);
  console.log("%s is streaming...", key);

  streamHt.tweet.subscribe((tweet: TweetData) => {
    let isTweetValid = checkIfTweetValidTracking(tweet);
    if (isTweetValid) {
      console.log("YaHoo! Found some valid tweet.\n");
      countFreqHashtag(tweet);
      totalCollectedTweet += 1;
      console.log("Total tweets = %s", totalCollectedTweet);
    }
  });

  return streamHt;
}

function checkHashtagToStopStream() {
  console.log("------------------------------------------------");
  runningHashtag.forEach((value, key) => {
    if (value) {
      var val = tempFreqHashtag.get(key).count;
      console.log("%s = %s", key, val);
      if (val < thresholdValidHashtag) {
        console.log("Disconnecting stream of unvalid hashtag: %s", key);
        stopStreamManager(key);
      }
    }
  });
  tempFreqHashtag.clear();
}
