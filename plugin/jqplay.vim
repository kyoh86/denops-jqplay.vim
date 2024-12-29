command! -nargs=* -complete=file -range=% JqplayBuffer call denops#notify("jqplay", "command:buffer", [[join(["--lnum", <q-line1>], "="), join(["--end", <q-line2>], "="), <f-args>]])
command! -nargs=+ -complete=file JqplayFile call denops#notify("jqplay", "command:file", [[<f-args>]])
command! -nargs=* -complete=file JqplayEmpty call denops#notify("jqplay", "command:empty", [[<f-args>]])
