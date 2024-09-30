import mock from "http-request-mock";
import { expect, it, describe, beforeEach, afterEach, jest } from "@jest/globals";
import { CartesiClient, CartesiClientBuilder } from "../src";
import { Network, type Provider, ethers, ContractTransactionResponse } from "ethers";
import { Hex } from "../src/hex";
import type { InputBox } from "@cartesi/rollups";
import type { Log } from "../src/types";
import { randomBytes } from "crypto"

function generateValidEth(): string {
    const rb = randomBytes(20);
    const address = `0x${rb.toString("hex")}`;
    
    return address;
}

describe.skip("CartesiClient", () => {
    const mocker = mock.setupForUnitTest("fetch");

    let cartesiClient: CartesiClient;
    const endpoint = new URL("http://127.0.0.1:8545/inspect");

    beforeEach(async () => {
        const provider = ethers.getDefaultProvider(endpoint.href);
        cartesiClient = new CartesiClientBuilder().withEndpoint(endpoint).withProvider(provider).build();
    });

    afterEach(() => {
        mocker.reset();
    });

    describe("inspect", () => {
        it("should return null if the response is not valid", async () => {
            // Arrange
            const payload = { action: "show_games" };
            const wrongBody = {
                foo: "bar",
            };
            mocker.get(endpoint.href, wrongBody, {
                times: 1,
            });

            // Act
            const result = await cartesiClient.inspect(payload);

            // Assert
            expect(result).toBeNull();
        });

        it("should return the payload from the first report if the response is valid", async () => {
            // Arrange
            const payload = { action: "show_games" };
            const games = { games: [1, 2, 3] };
            const gamesPayload = Hex.obj2hex(games);
            mocker.get(
                endpoint.href,
                {
                    reports: [{ payload: gamesPayload }],
                },
                {
                    times: 1,
                }
            );

            // Act
            const result = await cartesiClient.inspect(payload);

            // Assert
            expect(result).toMatchObject(games);
        });
    });

    describe("advance", () => {
        describe("should error", () => {
            it("Error network if an exception is thrown", async () => {
                // Arrange
                const payload = { action: "new_player", name: "calindra" };
                const logger: Log = { error: jest.fn(), info: console.log };
                const address = generateValidEth();

                const provider = {
                    getNetwork: jest.fn<() => Promise<unknown>>().mockRejectedValueOnce(new Error("network error")),
                } as any as Provider;

                const client = new CartesiClientBuilder()
                    .withDappAddress(address)
                    .withLogger(logger) //omit error log
                    .withProvider(provider)
                    .build();
                // Act / Assert
                return expect(client.advance(payload)).rejects.toThrow("network error");
            });

            it("Error contract if an exception is thrown", async () => {
                // Arrange
                const payload = { action: "new_player", name: "calindra" };
                const logger: Log = { error: jest.fn(), info: console.log };
                const address = generateValidEth();

                const provider: Pick<Provider, "getNetwork"> = {
                    getNetwork: jest
                        .fn<Provider["getNetwork"]>()
                        .mockReturnValueOnce(Promise.resolve(new Network("homestead", 1))),
                };

                const inputContract: Pick<InputBox, "addInput"> = {
                    addInput: jest.fn<InputBox["addInput"]>().mockRejectedValueOnce(new Error("contract error")),
                };

                const client = new CartesiClientBuilder()
                    .withDappAddress(address)
                    .withLogger(logger) //omit error log
                    .withProvider(provider as Provider)
                    .build();
                jest.spyOn(client, "getInputContract").mockResolvedValue(inputContract as InputBox);
                // Act / Assert
                return expect(client.advance(payload)).rejects.toThrow("contract error");
            });
        });

        it("should call successful", async () => {
            // Arrange
            const payload = { action: "new_player", name: "calindra" };

            const address = generateValidEth();

            const advance_endpoint = new URL("/advance", endpoint).href;
            const provider = ethers.getDefaultProvider(advance_endpoint);

            const inputContract: Pick<InputBox, "addInput"> = {
                addInput: jest.fn<() => Promise<ethers.ContractTransaction>>().mockResolvedValueOnce({
                    hash: "mocked hash",
                    wait: jest.fn<() => Promise<ContractTransactionResponse["wait"]>>().mockResolvedValueOnce({} as any),
                } as any),
            };

            jest.spyOn(provider, "getNetwork").mockResolvedValue(new Network("hardhat", 8545));

            const client = new CartesiClientBuilder()
                .withEndpoint(advance_endpoint)
                .withProvider(provider)
                .withDappAddress(address)
                .build();

            jest.spyOn(client, "getInputContract").mockResolvedValue(inputContract as InputBox);
            // Act / Assert
            return expect(client.advance(payload)).resolves.not.toThrow();
        });
    });
});
