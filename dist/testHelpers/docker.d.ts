/// <reference types="node" />
import { Container } from 'dockerode';
import { Stream } from 'stream';
export declare function promisifyStream(stream: Stream): Promise<string>;
export declare function pullImage(docker: any, imageName: string): Promise<void>;
export declare function waitForPostgres(container: Container): Promise<void>;
export declare function wait(ms: number): Promise<unknown>;
export declare function startPostgresContainer(docker: any, imageName: string, containerName: string, dbName: string, dbUser: string, dbPass: string, hostPort?: number): Promise<void>;
export declare function removePostgresContainer(docker: any, containerName: string): Promise<void>;
