command! -nargs=* -complete=file -range Jqplay call denops#notify("jqplay", "command:start", [[<f-args>]])
