"use client";

import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

// HOOK NOT WRITTEN BY ME.
// ADAPTED TO TYPESCRIPT,
// SOURCE: https://github.com/mutsuyuki/Leaflet.SmoothWheelZoom

L.Map.mergeOptions({
  smoothWheelZoom: true,
  smoothSensitivity: 1,
});

// Needed to make Typescript happy
declare module "leaflet" {
  interface MapOptions {
    smoothWheelZoom?: "center" | boolean | undefined;
    smoothSensitivity?: number | undefined;
  }

  interface Map {
    _limitZoom: (zoom: number) => number;
    _move: (
      center: L.LatLng,
      zoom: number,
      data?: unknown,
      supressEvent?: boolean,
    ) => this;
    _moveStart: (zoomChanged: boolean, noMoveStart: boolean) => this;
    _moveEnd: (zoomChanged: boolean) => this;
    _stop: () => this;
    _panAnim: L.PosAnimation;
  }
}

/**
 * An invisible element used to allow scrolling to zoom the map. Disables the "use two fingers and pinch to zoom" gesture.
 * 
 * Relies on a leaflet plugin written in Javascript.
 * 
 * @returns - A null element.
 */
export default function SmoothWheelZoom() {
  const map = useMap();

  useEffect(() => {
    let isWheeling: boolean;
    let wheelMousePosition: L.Point;
    let center: L.LatLng;
    let centerPoint: L.Point;
    let startLatLng: L.LatLng;
    let wheelStartLatLng: L.LatLng;
    let moved: boolean;
    let goalZoom: number;
    let zoom: number;
    let prevCenter: L.LatLng;
    let prevZoom: number;
    let zoomAnimationId: number;
    let timeoutId: NodeJS.Timeout;

    function onWheelScroll(e: Event) {
      if (!(e instanceof MouseEvent)) return;

      if (!isWheeling) onWheelStart(e);
      onWheeling(e);
    }

    function onWheelStart(e: MouseEvent) {
      isWheeling = true;
      wheelMousePosition = map.mouseEventToContainerPoint(e);
      centerPoint = map.getSize().divideBy(2);
      startLatLng = map.containerPointToLatLng(centerPoint);
      wheelStartLatLng = map.containerPointToLatLng(wheelMousePosition);
      moved = false;

      map._stop();
      if (map._panAnim) map._panAnim.stop();

      goalZoom = map.getZoom();
      prevCenter = map.getCenter();
      prevZoom = map.getZoom();

      zoomAnimationId = requestAnimationFrame(updateWheelZoom);
    }

    function onWheeling(e: MouseEvent) {
      goalZoom +=
        L.DomEvent.getWheelDelta(e) *
        0.003 *
        (map.options.smoothSensitivity ?? 1);
      if (goalZoom < map.getMinZoom() || goalZoom > map.getMaxZoom())
        goalZoom = map._limitZoom(goalZoom);
      wheelMousePosition = map.mouseEventToContainerPoint(e);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(onWheelEnd, 200);

      L.DomEvent.preventDefault(e);
      L.DomEvent.stopPropagation(e);
    }

    function onWheelEnd() {
      isWheeling = false;
      cancelAnimationFrame(zoomAnimationId);
      map._moveEnd(true);
    }

    function updateWheelZoom() {
      if (!map.getCenter().equals(prevCenter) || map.getZoom() != prevZoom)
        return;

      zoom = map.getZoom() + (goalZoom - map.getZoom()) * 0.3;
      zoom = Math.floor(zoom * 100) / 100;

      const delta = wheelMousePosition.subtract(centerPoint);
      if (delta.x === 0 && delta.y === 0) return;

      if (map.options.smoothWheelZoom === "center") center = startLatLng;
      else
        center = map.unproject(
          map.project(wheelStartLatLng, zoom).subtract(delta),
          zoom,
        );

      if (!moved) {
        map._moveStart(true, false);
        moved = true;
      }

      map._move(center, zoom);
      prevCenter = map.getCenter();
      prevZoom = map.getZoom();

      zoomAnimationId = requestAnimationFrame(updateWheelZoom);
    }

    L.DomEvent.on(map.getContainer(), "wheel", onWheelScroll, {});
  }, [map]);

  return null;
}