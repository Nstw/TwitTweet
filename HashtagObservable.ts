import twit from "./mytwit";
import fs from "fs";
import { Subject } from "rxjs";
import Twit from "twit";

const fsp = fs.promises;

export default class HashtagObserver {
  public readonly tweet: Subject<any>;
  private internalStream: Twit.Stream;

  constructor(private readonly hashtagStr: string) {
    this.tweet = new Subject<any>();
    this.internalStream = twit.stream("statuses/filter", {
      track: hashtagStr
    });
    this.internalStream.addListener("tweet", this.__internalOnTweet.bind(this));
  }

  private __internalOnTweet(tweet: any) {
    this.tweet.next(tweet);
  }

  stop() {
    this.internalStream.removeListener("tweet", this.__internalOnTweet);
    this.internalStream.stop();
  }
}
