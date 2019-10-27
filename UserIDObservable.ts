import twit from "./mytwit";
import fs from "fs";
import { Subject } from "rxjs";
import Twit from "twit";

const fsp = fs.promises;

export default class UserIDObserver {
  public readonly tweet: Subject<any>;
  private internalStream: Twit.Stream;

  constructor(private readonly userIds: string[]) {
    this.tweet = new Subject<any>();
    this.internalStream = twit.stream("statuses/filter", {
      follow: userIds
    });
    this.internalStream.addListener("tweet", this.__internalOnTweet.bind(this));
    this.internalStream.addListener(
      "disconnect",
      this.__disconnectOnStream.bind(this)
    );
  }

  private __internalOnTweet(tweet: any) {
    this.tweet.next(tweet);
  }

  private __disconnectOnStream() {
    console.log("Stream disconnecting...\n");
  }

  stop() {
    this.internalStream.removeListener("tweet", this.__internalOnTweet);
    this.internalStream.removeListener(
      "disconnect",
      this.__internalOnTweet.bind(this)
    );
    this.internalStream.stop();
  }
}
