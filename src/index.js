require("dotenv").config();

const fastify = require("fastify")();
const chalk = require("chalk");
const { Redis } = require("@upstash/redis");

const redis = new Redis({
    url: process.env.UPSTASH_URL,
  token: process.env.UPSTASH_TOKEN,
});
});

fastify.get("/", async () => { return { status: "MIRAR API online" };
});

/* ---------------- PUBLIC ---------------- */

fastify.post("/mirar/register/:botId/:value", async (req, reply) => {
  const { botId, value } = req.params;

  if (await redis.exists(`mirar:user:${botId}`)) {
    return reply.code(409).send({ error: "Bot already exists" });
  }

  await redis.hset(`mirar:user:${botId}`, {
    id: botId,
    value: Number(value),
    status: "pending",
    requestedAT: Date.now(),
  });

  reply.send({ success: true, botId, value, status: "pending" });
});

fastify.post(
  "/mirar/change/:fromBot/:toBot/:userId/:amount",
  async (req, reply) => {
    const { fromBot, toBot, userId, amount } = req.params;
    const amt = Number(amount);

    if (amt <= 0) {
      return reply.code(400).send({ error: "Invalid amount" });
    }

    const fromBotData = await redis.hgetall(`mirar:user:${fromBot}`);
    const toBotData = await redis.hgetall(`mirar:user:${toBot}`);

    if (!fromBotData?.value || !toBotData?.value) {
      return reply.code(404).send({ error: "Bot not found" });
    }

    if (
      fromBotData.status !== "approved" ||
      toBotData.status !== "approved"
    ) {
      return reply
        .code(403)
        .send({ error: "Both bots must be approved" });
    }

    const fromWallet = `mirar:wallet:${fromBot}:${userId}`;
    const toWallet = `mirar:wallet:${toBot}:${userId}`;

    const fromBalance =
      Number(await redis.hget(fromWallet, "balance")) || 0;

    if (fromBalance < amt) {
      return reply.code(400).send({ error: "Insufficient balance" });
    }

    const base = amt * Number(fromBotData.value);
    const converted = Math.floor(base / Number(toBotData.value));

    await redis.hset(fromWallet, {
      balance: fromBalance - amt,
    });

    const toBalance =
      Number(await redis.hget(toWallet, "balance")) || 0;

    await redis.hset(toWallet, {
      balance: toBalance + converted,
    });

    const txKey = `mirar:tx:${Date.now()}:${userId}`;

    await redis.hset(txKey, {
      fromBot,
      toBot,
      userId,
      spent: amt,
      received: converted,
      at: Date.now(),
    });

    reply.send({
      success: true,
      spent: amt,
      received: converted,
    });
  }
);

/* ---------------- TEAM (PRIVATE) ---------------- */

fastify.register(
  async (team) => {
    team.addHook("preHandler", async (req, reply) => {
      if (
        req.headers.authorization !==
        `Bearer ${process.env.TEAM_TOKEN}`
      ) {
        return reply
          .code(403)
          .send({ error: "Restricted to MIRAR Team" });
      }
    });

    team.post("/confirm/:botId", async (req, reply) => {
      const { botId } = req.params;

      if (!(await redis.exists(`mirar:user:${botId}`))) {
        return reply.code(404).send({ error: "Bot not found" });
      }

      await redis.hset(`mirar:user:${botId}`, {
        status: "approved",
        approvedAT: Date.now(),
      });

      reply.send({ success: true, botId });
    });

    team.get("/pending", async () => {
      const keys = await redis.keys("mirar:user:*");
      const pending = [];

      for (const key of keys) {
        const bot = await redis.hgetall(key);
        if (bot.status === "pending") {
          pending.push({
            id: bot.id,
            value: bot.value,
            requestedAT: bot.requestedAT,
          });
        }
      }

      return pending;
    });
  },
  { prefix: "/team" }
);

const port = process.env.PORT || 3000
fastify.listen({ port }, () => {
  console.log("🚀 MIRAR API online");
});
