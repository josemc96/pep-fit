import type { Locale } from "@pep-fit/shared-types";
import { useState } from "react";
import { View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { formatDayMonth, formatNumber } from "../../../lib/format";
import type { WeightPoint } from "../stats";

const HEIGHT = 180;
const PAD = { top: 16, right: 12, bottom: 24, left: 40 };
const INDIGO = "#4f46e5";
const EMERALD = "#059669";
const MUTED = "#64748b";
const GRID = "#e2e8f0";

const dayMs = (day: string) => Date.parse(`${day}T00:00:00Z`);

/**
 * Weight over time, spaced by date (not by entry), with the target weight
 * as a dashed line. Needs at least two points.
 */
export function WeightChart({
  points,
  targetKg,
  locale,
}: {
  points: WeightPoint[];
  targetKg: number | null;
  locale: Locale;
}) {
  const [width, setWidth] = useState(0);

  const weights = points.map((p) => p.weightKg);
  const values = targetKg === null ? weights : [...weights, targetKg];
  const minKg = Math.floor(Math.min(...values) - 1);
  const maxKg = Math.ceil(Math.max(...values) + 1);
  const firstDay = dayMs(points[0]!.day);
  const span = Math.max(1, dayMs(points.at(-1)!.day) - firstDay);

  const plotWidth = width - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (day: string) =>
    PAD.left + ((dayMs(day) - firstDay) / span) * plotWidth;
  const y = (kg: number) =>
    PAD.top + (1 - (kg - minKg) / (maxKg - minKg)) * plotHeight;

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {[minKg, maxKg].map((kg) => (
            <Line
              key={kg}
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(kg)}
              y2={y(kg)}
              stroke={GRID}
            />
          ))}
          {[minKg, maxKg].map((kg) => (
            <SvgText
              key={`label-${kg}`}
              x={PAD.left - 6}
              y={y(kg) + 4}
              fontSize={11}
              fill={MUTED}
              textAnchor="end"
            >
              {formatNumber(kg, locale)}
            </SvgText>
          ))}

          {targetKg !== null ? (
            <Line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(targetKg)}
              y2={y(targetKg)}
              stroke={EMERALD}
              strokeDasharray="6 4"
              strokeWidth={1.5}
            />
          ) : null}

          <Polyline
            points={points.map((p) => `${x(p.day)},${y(p.weightKg)}`).join(" ")}
            fill="none"
            stroke={INDIGO}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {points.map((p) => (
            <Circle
              key={p.day}
              cx={x(p.day)}
              cy={y(p.weightKg)}
              r={3.5}
              fill={INDIGO}
            />
          ))}

          <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={11} fill={MUTED}>
            {formatDayMonth(points[0]!.day, locale)}
          </SvgText>
          <SvgText
            x={width - PAD.right}
            y={HEIGHT - 6}
            fontSize={11}
            fill={MUTED}
            textAnchor="end"
          >
            {formatDayMonth(points.at(-1)!.day, locale)}
          </SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
