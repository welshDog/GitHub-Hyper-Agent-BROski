import { z } from 'zod';

declare const AppConfigSchema: z.ZodObject<{
    env: z.ZodEnum<["development", "staging", "production", "test"]>;
    port: z.ZodNumber;
    serviceName: z.ZodString;
    logging: z.ZodObject<{
        level: z.ZodEnum<["debug", "info", "warn", "error"]>;
        format: z.ZodString;
        redactKeys: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        level: "debug" | "info" | "warn" | "error";
        format: string;
        redactKeys: string[];
    }, {
        level: "debug" | "info" | "warn" | "error";
        format: string;
        redactKeys: string[];
    }>;
    database: z.ZodObject<{
        host: z.ZodString;
        port: z.ZodNumber;
        username: z.ZodString;
        password: z.ZodString;
        name: z.ZodString;
        pool: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        ssl: z.ZodUnion<[z.ZodBoolean, z.ZodEffects<z.ZodString, boolean, string>]>;
    }, "strip", z.ZodTypeAny, {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        pool: {
            min: number;
            max: number;
        };
        ssl: boolean;
    }, {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        pool: {
            min: number;
            max: number;
        };
        ssl: string | boolean;
    }>;
    api: z.ZodObject<{
        baseUrl: z.ZodString;
        timeoutMs: z.ZodNumber;
        retryAttempts: z.ZodNumber;
        services: z.ZodRecord<z.ZodString, z.ZodObject<{
            url: z.ZodString;
            apiKey: z.ZodOptional<z.ZodString>;
            publicKey: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        baseUrl: string;
        timeoutMs: number;
        retryAttempts: number;
        services: Record<string, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>;
    }, {
        baseUrl: string;
        timeoutMs: number;
        retryAttempts: number;
        services: Record<string, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>;
    }>;
    studio: z.ZodObject<{
        hardware: z.ZodObject<{
            microphone: z.ZodObject<{
                recommended: z.ZodArray<z.ZodString, "many">;
                filters: z.ZodArray<z.ZodString, "many">;
                interface: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                recommended: string[];
                filters: string[];
                interface: string;
            }, {
                recommended: string[];
                filters: string[];
                interface: string;
            }>;
            camera: z.ZodObject<{
                resolution: z.ZodString;
                framing: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                resolution: string;
                framing: string;
            }, {
                resolution: string;
                framing: string;
            }>;
            screen: z.ZodObject<{
                resolution: z.ZodString;
                aspectRatio: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                resolution: string;
                aspectRatio: string;
            }, {
                resolution: string;
                aspectRatio: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        }, {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        }>;
        software: z.ZodObject<{
            ide: z.ZodString;
            theme: z.ZodString;
            font: z.ZodObject<{
                family: z.ZodString;
                ligatures: z.ZodBoolean;
                size: z.ZodObject<{
                    editor: z.ZodNumber;
                    terminal: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    editor: number;
                    terminal: number;
                }, {
                    editor: number;
                    terminal: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            }, {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            }>;
            ui: z.ZodObject<{
                hideActivityBar: z.ZodBoolean;
                hideMinimap: z.ZodBoolean;
                cursorBlinking: z.ZodString;
                screencastMode: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            }, {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            }>;
        }, "strip", z.ZodTypeAny, {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        }, {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        }>;
        recording: z.ZodObject<{
            obs: z.ZodObject<{
                canvas: z.ZodString;
                fps: z.ZodNumber;
                bitrateKbps: z.ZodNumber;
                audioFilters: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            }, {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        }, {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        }>;
        project: z.ZodObject<{
            branching: z.ZodObject<{
                main: z.ZodString;
                starter: z.ZodString;
                checkpoints: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                main: string;
                starter: string;
                checkpoints: string[];
            }, {
                main: string;
                starter: string;
                checkpoints: string[];
            }>;
            hygiene: z.ZodObject<{
                linter: z.ZodString;
                formatter: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                linter: string;
                formatter: string;
            }, {
                linter: string;
                formatter: string;
            }>;
        }, "strip", z.ZodTypeAny, {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        }, {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        hardware: {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        };
        software: {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        };
        recording: {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        };
        project: {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        };
    }, {
        hardware: {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        };
        software: {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        };
        recording: {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        };
        project: {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        };
    }>;
}, "strip", z.ZodTypeAny, {
    port: number;
    env: "development" | "staging" | "production" | "test";
    serviceName: string;
    logging: {
        level: "debug" | "info" | "warn" | "error";
        format: string;
        redactKeys: string[];
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        pool: {
            min: number;
            max: number;
        };
        ssl: boolean;
    };
    api: {
        baseUrl: string;
        timeoutMs: number;
        retryAttempts: number;
        services: Record<string, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>;
    };
    studio: {
        hardware: {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        };
        software: {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        };
        recording: {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        };
        project: {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        };
    };
}, {
    port: number;
    env: "development" | "staging" | "production" | "test";
    serviceName: string;
    logging: {
        level: "debug" | "info" | "warn" | "error";
        format: string;
        redactKeys: string[];
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        pool: {
            min: number;
            max: number;
        };
        ssl: string | boolean;
    };
    api: {
        baseUrl: string;
        timeoutMs: number;
        retryAttempts: number;
        services: Record<string, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>;
    };
    studio: {
        hardware: {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        };
        software: {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        };
        recording: {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        };
        project: {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        };
    };
}>;
type AppConfig = z.infer<typeof AppConfigSchema>;
declare function loadConfig(configPath?: string): AppConfig;
declare const config: {
    port: number;
    env: "development" | "staging" | "production" | "test";
    serviceName: string;
    logging: {
        level: "debug" | "info" | "warn" | "error";
        format: string;
        redactKeys: string[];
    };
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        name: string;
        pool: {
            min: number;
            max: number;
        };
        ssl: boolean;
    };
    api: {
        baseUrl: string;
        timeoutMs: number;
        retryAttempts: number;
        services: Record<string, {
            url: string;
            apiKey?: string | undefined;
            publicKey?: string | undefined;
        }>;
    };
    studio: {
        hardware: {
            microphone: {
                recommended: string[];
                filters: string[];
                interface: string;
            };
            camera: {
                resolution: string;
                framing: string;
            };
            screen: {
                resolution: string;
                aspectRatio: string;
            };
        };
        software: {
            ide: string;
            theme: string;
            font: {
                family: string;
                ligatures: boolean;
                size: {
                    editor: number;
                    terminal: number;
                };
            };
            ui: {
                hideActivityBar: boolean;
                hideMinimap: boolean;
                cursorBlinking: string;
                screencastMode: boolean;
            };
        };
        recording: {
            obs: {
                canvas: string;
                fps: number;
                bitrateKbps: number;
                audioFilters: string[];
            };
        };
        project: {
            branching: {
                main: string;
                starter: string;
                checkpoints: string[];
            };
            hygiene: {
                linter: string;
                formatter: string;
            };
        };
    };
};

export { type AppConfig, config, loadConfig };
