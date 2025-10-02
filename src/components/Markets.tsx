// components/Markets.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Market = {
  ticker: string;
  bidPrice: number;
  bidQuantity: number;
  askPrice: number;
  askQuantity: number;
  eventTicker: string;
  title: string;
  teamName: string;
  expectedExpirationTimeUTC: Date;
  gameStartTimeMT: Date;
  estimatedStartTime: Date;
  gameDate: string; // "YYYY-MM-DD"
};

function parseUTC(s: string): Date {
  return new Date(s);
}

function parseMT(s: string): Date {
  const dateUTC = new Date(s);
  // Convert to America/Denver wall-time (drops tz info, keeps local clock)
  return new Date(
    dateUTC.toLocaleString("en-US", { timeZone: "America/Denver" })
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Denver",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateUTC(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function Markets({
  initialGameDays,
}: {
  initialGameDays: string[];
}) {
  const [connected, setConnected] = useState(false);
  const [markets, setMarkets] = useState<Record<string, Market>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // Convert ISO strings → Date once
  const gameDays = useMemo(
    () => initialGameDays.map((s) => new Date(s)),
    [initialGameDays]
  );

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_FASTAPI_WS}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const raw = JSON.parse(event.data);

      const market: Market = {
        ticker: raw.ticker,
        bidPrice: raw.bid_price,
        bidQuantity: raw.bid_quantity,
        askPrice: raw.ask_price,
        askQuantity: raw.ask_quantity,
        eventTicker: raw.event_ticker,
        title: raw.title,
        teamName: raw.team_name,
        expectedExpirationTimeUTC: parseUTC(raw.expected_expiration_time_utc),
        gameStartTimeMT: parseMT(raw.game_start_time_mt),
        estimatedStartTime: parseUTC(raw.estimated_start_time),
        gameDate: raw.game_date, // "YYYY-MM-DD"
      };

      setMarkets((prev) => ({ ...prev, [market.ticker]: market }));
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <>
      <div className="rounded-lg border p-4">
        Status:{" "}
        {connected ? "Connected to websocket" : "Disconnected from websocket"}
      </div>

      <div className="flex flex-col gap-4">
        {gameDays.map((gameDay) => {
          const key = gameDay.toISOString().split("T")[0];
          const rows = Object.values(markets)
            .filter((m) => m.gameDate === key)
            .sort(
              (a, b) =>
                a.gameStartTimeMT.getTime() - b.gameStartTimeMT.getTime()
            );

          return (
            <div key={key} className="rounded-lg border p-4">
              <h2 className="text-center text-lg font-semibold mb-4">
                {formatDateUTC(gameDay)}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="p-2" colSpan={3}></th>
                      <th className="p-2" colSpan={2}>
                        Bid
                      </th>
                      <th className="p-2" colSpan={2}>
                        Ask
                      </th>
                    </tr>
                    <tr className="border-y">
                      <th className="p-2 text-left">Ticker</th>
                      <th className="p-2 text-left">Team Name</th>
                      <th className="p-2 text-left">Game Start Time (MT)</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2 text-left">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((market) => (
                      <tr key={market.ticker} className="border-b">
                        <td className="p-2">{market.ticker.split("-")[2]}</td>
                        <td className="p-2">{market.teamName}</td>
                        <td className="p-2">
                          {formatTime(market.gameStartTimeMT)}
                        </td>
                        <td className="p-2">{market.bidQuantity}</td>
                        <td className="p-2">{market.bidPrice}</td>
                        <td className="p-2">{market.askPrice}</td>
                        <td className="p-2">{market.askQuantity}</td>
                      </tr>
                    ))}
                    {rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-4 text-center text-muted-foreground"
                        >
                          No markets yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
