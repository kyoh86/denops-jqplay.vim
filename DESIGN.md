# Design

jqplay handles the following types of buffer:

- filter buffer
    - name: `jqfilter://<source_type>/<source_name>?session_id=<session_id>`
    - parameters:
        - `<source_type>`: file, empty, buffer, url, exec
        - `<source_name>`: file path, buffer name, URL, command
        - `<session_id>`: session ID. This is a unique ID for each session.
- output buffer
    - `jqoutput://session/<session_id>`

and supports the following sources:

- file source
- TODO: empty source (for jq generation)
- TODO: buffer source
- TODO: URL source
- TODO: exec stdout source

## What functions do

### play

- create a new session for the given file
- create a new filter buffer for the session
- create a new output buffer for the session

### command:play

- accept a arguments from the user command
- call the `play` function

### event:apply

- apply the filter buffer to the file source
- write the output to the output buffer

### play
