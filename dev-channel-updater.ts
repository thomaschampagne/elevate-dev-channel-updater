import * as _ from "lodash";
import * as fs from "fs";
import * as del from "del";
import * as request from "request";
import { Response } from "request";
import { BitBucketApi } from "./bit-bucket-api";
import { ElevateBuildModel } from "./elevate-build.model";
import { Extract } from "unzipper";

export class DevChannelUpdater {

    public static readonly LAST_CI_BUILDS_URL: string = "https://api.bitbucket.org/2.0/repositories/thomaschampagne/elevate-ci-builds/downloads?pagelen=1";
    public static readonly ARCHIVE_NAME: string = "elevate.zip";
    public static readonly OUTPUT_FOLDER: string = "elevate";

    public elevateBuildModel: ElevateBuildModel;

    public static parseBitBucketBuild(bitBucketBuild: BitBucketApi.Build): ElevateBuildModel {

        let splitParser = bitBucketBuild.name.split("_");
        const version = splitParser[0];
        const channel = splitParser[1];
        splitParser = splitParser[2].split(".");
        const branch = splitParser[1];
        const commitShort = splitParser[2];

        return {
            date: new Date(bitBucketBuild.created_on),
            branch: branch,
            commitShort: commitShort,
            version: version.replace("v", ""),
            channel: channel,
            size: _.round(bitBucketBuild.size / (1024 * 1024), 2),
            downloadCount: bitBucketBuild.downloads,
            downloadLink: bitBucketBuild.links.self.href
        };
    }

    public update(): void {

        // Clean existing archive or extension folder
        this.clean();

        // Let's go !
        this.getBitBucketLatestBuild().then((response: BitBucketApi.Response) => {
            this.elevateBuildModel = DevChannelUpdater.parseBitBucketBuild(_.first(response.values));
            return this.fetchArchive(this.elevateBuildModel.downloadLink);
        }).then(() => {
            return this.unzipArchive();
        }).then(() => {
            console.log("Updated with dev channel. Version: " + this.elevateBuildModel.version + "; Date: " + this.elevateBuildModel.date + " Commit: " + this.elevateBuildModel.commitShort);
        }).catch(error => {
            console.error(error);
        });
    }

    public getBitBucketLatestBuild(): Promise<BitBucketApi.Response> {
        return new Promise<BitBucketApi.Response>((resolve, reject) => {

            const headers = {
                "Content-Type": "application/json"
            };

            request(DevChannelUpdater.LAST_CI_BUILDS_URL, {headers: headers}, (error: any, response: Response) => {
                if (error) {
                    reject(error);
                } else {
                    if (response.statusCode === 200) {
                        resolve(JSON.parse(response.body));
                    } else {
                        reject(response);
                    }
                }
            });
        });
    }

    public fetchArchive(url: string): Promise<void> {
        console.log("Downloading " + url);
        return new Promise<void>((resolve, reject) => {
            const outputFileStream = fs.createWriteStream(DevChannelUpdater.ARCHIVE_NAME);
            request(url)
                .pipe(outputFileStream)
                .on('error', reject);

            outputFileStream.once("close", () => {
                resolve();
            });
        });
    }

    public unzipArchive(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.createReadStream(DevChannelUpdater.ARCHIVE_NAME)
                .pipe(Extract({path: DevChannelUpdater.OUTPUT_FOLDER}))
                .promise()
                .then(resolve, error => reject(error));
        });
    }

    public clean(): void {
        del.sync([DevChannelUpdater.ARCHIVE_NAME, DevChannelUpdater.OUTPUT_FOLDER]);
    }

}
