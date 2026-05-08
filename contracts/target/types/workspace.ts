/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/workspace.json`.
 */
export type Workspace = {
  "address": "77NnA7iRfthT8wcdWxNsrueXbF7o251BzdBBDnDW4znf",
  "metadata": {
    "name": "workspace",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimNftBadge",
      "discriminator": [
        23,
        126,
        101,
        224,
        53,
        109,
        97,
        63
      ],
      "accounts": [
        {
          "name": "habitCommitment",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  98,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "habit_commitment.owner",
                "account": "habitCommitment"
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "streakMilestone",
          "type": "u8"
        },
        {
          "name": "epochId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "depositStake",
      "discriminator": [
        160,
        167,
        9,
        220,
        74,
        243,
        228,
        43
      ],
      "accounts": [
        {
          "name": "habitCommitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  98,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "goalType",
          "type": "u8"
        },
        {
          "name": "dailyTarget",
          "type": "u32"
        },
        {
          "name": "epochDays",
          "type": "u8"
        },
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "epochId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeConfig",
      "discriminator": [
        208,
        127,
        21,
        1,
        194,
        190,
        196,
        70
      ],
      "accounts": [
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "settleEpoch",
      "discriminator": [
        148,
        223,
        178,
        38,
        201,
        158,
        167,
        13
      ],
      "accounts": [
        {
          "name": "habitCommitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  98,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "habit_commitment.owner",
                "account": "habitCommitment"
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "stakingPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        }
      ]
    },
    {
      "name": "verifyHabit",
      "discriminator": [
        233,
        42,
        122,
        64,
        194,
        44,
        168,
        119
      ],
      "accounts": [
        {
          "name": "habitCommitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  98,
                  105,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "habit_commitment.owner",
                "account": "habitCommitment"
              },
              {
                "kind": "arg",
                "path": "epochId"
              }
            ]
          }
        },
        {
          "name": "stakingPool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  116,
                  97,
                  107,
                  105,
                  110,
                  103,
                  95,
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "oracle",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "epochId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "habitCommitment",
      "discriminator": [
        179,
        61,
        4,
        138,
        77,
        153,
        245,
        28
      ]
    },
    {
      "name": "stakingPool",
      "discriminator": [
        203,
        19,
        214,
        220,
        220,
        154,
        24,
        102
      ]
    }
  ],
  "events": [
    {
      "name": "badgeClaimed",
      "discriminator": [
        11,
        176,
        119,
        121,
        7,
        255,
        229,
        74
      ]
    },
    {
      "name": "epochSettled",
      "discriminator": [
        32,
        219,
        45,
        156,
        250,
        115,
        190,
        255
      ]
    },
    {
      "name": "habitVerified",
      "discriminator": [
        32,
        103,
        142,
        171,
        212,
        164,
        144,
        146
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidGoalType",
      "msg": "Invalid goal type"
    },
    {
      "code": 6001,
      "name": "invalidEpochDays",
      "msg": "Invalid epoch days"
    },
    {
      "code": 6002,
      "name": "insufficientStake",
      "msg": "Insufficient stake amount"
    },
    {
      "code": 6003,
      "name": "alreadySettled",
      "msg": "Epoch already settled"
    },
    {
      "code": 6004,
      "name": "epochNotComplete",
      "msg": "Epoch not yet complete"
    },
    {
      "code": 6005,
      "name": "unauthorizedOracle",
      "msg": "Unauthorized oracle"
    },
    {
      "code": 6006,
      "name": "invalidMilestone",
      "msg": "Invalid milestone"
    },
    {
      "code": 6007,
      "name": "insufficientStreak",
      "msg": "Insufficient streak"
    },
    {
      "code": 6008,
      "name": "mathOverflow",
      "msg": "Math overflow"
    }
  ],
  "types": [
    {
      "name": "badgeClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "milestone",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "isPaused",
            "type": "bool"
          },
          {
            "name": "version",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "epochSettled",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "isWinner",
            "type": "bool"
          },
          {
            "name": "rewardAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "habitCommitment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "goalType",
            "type": "u8"
          },
          {
            "name": "dailyTarget",
            "type": "u32"
          },
          {
            "name": "stakeAmount",
            "type": "u64"
          },
          {
            "name": "epochDays",
            "type": "u8"
          },
          {
            "name": "daysVerified",
            "type": "u8"
          },
          {
            "name": "streakCount",
            "type": "u8"
          },
          {
            "name": "isSettled",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "habitVerified",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "epochId",
            "type": "u64"
          },
          {
            "name": "daysVerified",
            "type": "u8"
          },
          {
            "name": "streakCount",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "stakingPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "totalStaked",
            "type": "u64"
          },
          {
            "name": "totalYieldAccumulated",
            "type": "u64"
          },
          {
            "name": "epochCount",
            "type": "u64"
          },
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
