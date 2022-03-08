import React, {FC, useEffect, useState} from "react";
import {Organisation} from "../../types";
import {Box, Button, Card, CardContent, TextField} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import {useIntl} from "react-intl";
import EditOrganisation from "../edit-organisation";
import {ApiClient} from "../../utils";

const api = new ApiClient<Organisation, 'locations'>('organisations');

const EditOrganisations: FC = () => {
  const intl = useIntl();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [enteredText, setEnteredText] = useState('');
  useEffect(() => {
    api.all().then(o => setOrganisations(o))
  }, []);
  return (
    <Card>
      <CardContent>
        {organisations.map(organisation => (
          <EditOrganisation key={`edit-organisation-${organisation.id}`} id={organisation.id} />
        ))}
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', py: 1 }}>
          <Box sx={{ flexGrow: 1, px: 1 }}>
            <TextField
              label={intl.formatMessage({ id: 'input.organisation.name.new' })}
              variant="standard"
              fullWidth
              value={enteredText}
              onChange={(e) => setEnteredText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  api.create({name: enteredText}).then((o) => {
                    setEnteredText('');
                    setOrganisations(o);
                  });
                }
              }}
            />
          </Box>
          <Box>
            <Button
              variant="contained"
              disabled={!enteredText}
              onClick={() => {
                api.create({name: enteredText}).then((o) => {
                  setEnteredText('');
                  setOrganisations(o);
                });
              }}
            >
              <AddIcon />
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditOrganisations;
