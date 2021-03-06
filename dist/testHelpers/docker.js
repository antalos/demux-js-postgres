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
exports.removePostgresContainer = exports.startPostgresContainer = exports.wait = exports.waitForPostgres = exports.pullImage = exports.promisifyStream = void 0;
function promisifyStream(stream) {
    const data = [];
    return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => data.push(chunk));
        stream.on('end', () => {
            const toReturn = Buffer.concat(data).toString();
            resolve(toReturn);
        });
        stream.on('error', () => reject());
    });
}
exports.promisifyStream = promisifyStream;
function pullImage(docker, imageName) {
    return __awaiter(this, void 0, void 0, function* () {
        const stream = yield docker.pull(imageName);
        yield promisifyStream(stream);
    });
}
exports.pullImage = pullImage;
function waitForPostgres(container) {
    return __awaiter(this, void 0, void 0, function* () {
        let connectionTries = 0;
        while (connectionTries < 40) {
            const exec = yield container.exec({
                Cmd: ['pg_isready'],
                AttachStdin: true,
                AttachStdout: true,
            });
            const { output } = yield exec.start({ hijack: true, stdin: true });
            const data = yield promisifyStream(output);
            const status = data.split(' - ')[1].trim();
            if (status === 'accepting connections') {
                yield wait(1000);
                break;
            }
            connectionTries += 1;
            yield wait(500);
        }
        if (connectionTries === 30) {
            throw Error('Too many tries to connect to database');
        }
    });
}
exports.waitForPostgres = waitForPostgres;
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
exports.wait = wait;
function startPostgresContainer(docker, imageName, containerName, dbName, dbUser, dbPass, hostPort = 5432) {
    return __awaiter(this, void 0, void 0, function* () {
        const hostPortString = hostPort.toString();
        const container = yield docker.createContainer({
            Image: imageName,
            name: containerName,
            Tty: false,
            PortBindings: { '5432/tcp': [{ HostPort: hostPortString }] },
            Env: [
                `POSTGRES_DB=${dbName}`,
                `POSTGRES_USER=${dbUser}`,
                `POSTGRES_PASSWORD=${dbPass}`,
            ],
        });
        yield container.start();
        yield waitForPostgres(container);
    });
}
exports.startPostgresContainer = startPostgresContainer;
function removePostgresContainer(docker, containerName) {
    return __awaiter(this, void 0, void 0, function* () {
        const containers = yield docker.listContainers({ all: true });
        for (const containerInfo of containers) {
            if (containerInfo.Names[0] === `/${containerName}`) {
                const container = docker.getContainer(containerInfo.Id);
                if (containerInfo.State !== 'exited') {
                    yield container.stop();
                }
                yield container.remove();
            }
        }
    });
}
exports.removePostgresContainer = removePostgresContainer;
//# sourceMappingURL=docker.js.map