import { Command } from ".";
import { color } from 'console-log-colors';

export const commands: Command[] = [
    {
        name: "error",
        alias: ["e"],
        exec: (args, it) => {
            it.println(color.red(args.join(" ")))
        }
    },
    {
        name: "ctx",
        exec: (_, it, ctx) => it.println(JSON.stringify(ctx, null, 2))
    },
    {
        name: "hello",
        alias: ["h"],
        exec: (_, it) => {
            it.println("world");
        },
        subcommands: [
            {
                name: "world",
                alias: ["w"],
                exec: (args, it) => {
                    if (args.length === 0) {
                        it.println("please tell me your name");
                    } else {
                        it.println("hello to you " + args.join(" "));
                    }
                },
            },
        ],
    },
    {
        name: "progress",
        alias: ["p"],
        exec: async (args, it) => {
            const bar = args.includes("-b") || args.includes("--bar");

            const max = 100;
            const blockCount = 10;
            for (let i = 0; i <= max; i++) {
                let line = "";

                if (bar) {
                    const blocks = Math.floor((i / max) * blockCount);
                    let progressBar = "";
                    for (let j = 0; j < blockCount; j++) {
                        progressBar += j < blocks ? "=" : " ";
                    }

                    line += `[${progressBar}] `;
                }

                line += `${i}%`;

                it.clear();
                it.print(line);
                await new Promise((res) => setTimeout(res, 50));
            }
            it.println(color.green(" Done"));
        },
    },
    {
        name: "npm",
        exec: (_, it) => {it.println("npm")},
        subcommands: [{
            name: "install",
            alias: ["i"],
            exec: (args, it) => { 
                if(args.length === 0) {
                    it.println("no package to install")
                    return;
                }
                it.println(`installing ${args.join(", ")}`)
            }
        }]
    }
];