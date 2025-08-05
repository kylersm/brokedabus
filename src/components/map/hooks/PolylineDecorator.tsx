"use client";

import React, { useEffect } from "react";
import { Polyline, useMap, type PolylineProps } from "react-leaflet";
import L, { type PolylineDecoratorOptions } from "leaflet";
import "leaflet-polylinedecorator";

/**
 * Decorates a polyline element. Used primarily in this project for drawing directional arrows on a polyline.
 * Usage of leaflet-polylinedecorator package. 
 * 
 * Works by returning an element, and hooks into the element with a reference to use L.polylineDecorator.
 * 
 * @param props - Standard polyline options for react-leaflet, combined with decorator options.
 * @returns - A polyline element.
 */
export default function PolylineDecorator(props: PolylineProps & PolylineDecoratorOptions) {
  const map = useMap();
  const polylineRef = React.createRef<L.Polyline>();
  const decoratorRef = React.useRef<L.PolylineDecorator>(null);

  useEffect(() => {
    if(polylineRef.current) {
      const polyline = polylineRef.current;
      const decorator = L.polylineDecorator(polyline, {
        patterns: props.patterns
      }).addTo(map);
      decoratorRef.current = decorator;
      return () => {
        if (decoratorRef.current)
          decoratorRef.current.remove();
      }
    }
  }, [polylineRef, props.patterns, map]);

  return <Polyline ref={polylineRef} {...props}/>;
}