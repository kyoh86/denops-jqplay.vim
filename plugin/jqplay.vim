command! -nargs=1 -complete=file -range Jqplay call denops#notify("jqplay", "command:play", [<q-mods>, [<f-args>]])
