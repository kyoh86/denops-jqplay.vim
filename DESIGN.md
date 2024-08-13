# Design

jqplay handles the following types of buffer:

- filter buffer
  - name: `jqplay://query;kind=<source_kind>&name=<source_name>`
  - parameters:
    - `<source_kind>`: file, empty, buffer, url, exec
    - `<source_name>`: file path, buffer name, URL, command
- output buffer
  - `jqplay://output;session=<session_id>`

and supports the following sources:

- file source
- TODO: empty source (for jq generation)
- TODO: buffer source
- TODO: URL source
- TODO: exec stdout source

## What functions do

### play

- create a new session

### command:play

- accept a arguments from the user command
- call the `play` function

### event:apply

- apply the filter buffer to the file source
- write the output to the output buffer

### play

## Commands

```
:[range]Jqplay [{file}]
```
