/**
 * components/carousel/CarouselRow.tsx
 * Content-specific rows built on the generic Carousel primitive.
 * Evolves the legacy components/home/CarouselRow.tsx. (Req 4.6, 4.9)
 */

import { MovieCard, type MovieCardData } from "@/components/home/MovieCard";
import { SeriesCard, type SeriesCardData } from "@/components/home/SeriesCard";
import { Carousel } from "./Carousel";

export function CarouselRow({
  title,
  movies,
  seeAllHref,
}: {
  title: string;
  movies: MovieCardData[];
  seeAllHref?: string;
}) {
  if (movies.length === 0) return null;
  return (
    <Carousel title={title} seeAllHref={seeAllHref}>
      {movies.map((m) => (
        <div key={m.id} className="mz-snap-start">
          <MovieCard movie={m} />
        </div>
      ))}
    </Carousel>
  );
}

export function SeriesRow({
  title,
  series,
  seeAllHref,
}: {
  title: string;
  series: SeriesCardData[];
  seeAllHref?: string;
}) {
  if (series.length === 0) return null;
  return (
    <Carousel title={title} seeAllHref={seeAllHref}>
      {series.map((s) => (
        <div key={s.id} className="mz-snap-start">
          <SeriesCard movie={s} />
        </div>
      ))}
    </Carousel>
  );
}
