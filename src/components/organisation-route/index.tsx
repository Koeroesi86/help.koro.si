import React, {FC, useEffect, useMemo, useState} from "react";
import {Link as RLink, useParams} from "react-router-dom";
import {createStyles, makeStyles} from "@mui/styles";
import {CircularProgress, Link, List, Theme, Typography} from "@mui/material";
import {LatLngExpression} from "leaflet";
import ReactMarkdown from "react-markdown";
import RemarkBreaks from "remark-breaks";
import RemarkGfm from "remark-gfm";
import {Organisation} from "../../types";
import MapBlock from "../map-block";
import LocationListItem from "../location-list-item";
import useApiClient from "../../hooks/useApiClient";
import useLocations from "../../hooks/useLocations";
import useNeeds from "../../hooks/useNeeds";

const useStyles = makeStyles((theme: Theme) => createStyles({
  map: {
    height: '400px',
    width: '100%',
    minWidth: '200px',
    boxSizing: 'border-box',
  },
}));

const OrganisationRoute: FC = () => {
  const params = useParams();
  const styles = useStyles();
  const api = useApiClient<'organisations'>('organisations');
  const [organisation, setOrganisation] = useState<Organisation>();
  const [center] = useState<LatLngExpression>({
    lat: 47.497913,
    lng: 19.040236,
  });
  const filter = useMemo(() => ({ organisationId: params.organisationId }), [params.organisationId]);
  const locations = useLocations(filter);
  const needs = useNeeds();

  useEffect(() => {
    api.one(params.organisationId).then(setOrganisation).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  if (!organisation) return <CircularProgress />;

  const locationsWithGeo = locations.filter((l) => l.location);

  return (
    <>
      <Typography variant="h3" sx={{ my: 2 }}>
        {organisation.name}
      </Typography>
      <MapBlock
        center={center}
        zoom={6}
        className={styles.map}
        markers={locationsWithGeo.map((loc) => ({
          lat: loc.location.lat,
          lng: loc.location.lng,
          popup: (
            <>
              <Link
                to={`/locations/${loc.id}`}
                component={RLink}
                color="inherit"
                sx={{ display: 'block' }}
              >
                {loc.location.text}
              </Link>
              <Link
                href={`https://maps.google.com/maps?q=${loc.location.lat},${loc.location.lng}`}
                target="_blank"
                color="inherit"
                sx={{ display: 'block' }}
              >
                Google
              </Link>
            </>
          ),
        }))}
      />
      {organisation.description && (
        <ReactMarkdown
          linkTarget="_blank"
          skipHtml
          unwrapDisallowed
          children={organisation.description}
          remarkPlugins={[RemarkBreaks, RemarkGfm]}
        />
      )}
      <List>
        {locations.map((loc) => (
          <LocationListItem
            key={`location-list-item-${loc.id}`}
            location={loc}
            needs={needs.filter((n) => n.locationId === loc.id)}
          />
        ))}
      </List>
    </>
  );
};

export default OrganisationRoute;
