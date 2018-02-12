

# Run get_radio_obs

Create a environment file with contents like this:

```
CLASSROOM_ID=725
DATABASE_URL=postgres://dbname:dbpassword@somehost:5432/dbname
```

Then run: `env $(cat .wf.env | xargs) ./tools/get_radio_obs.py`
