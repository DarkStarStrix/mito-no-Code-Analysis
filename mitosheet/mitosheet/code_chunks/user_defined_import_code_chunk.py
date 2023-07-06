
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import Dict, List, Optional, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID, UserDefinedImporterParamType
from mitosheet.state import State
from mitosheet.transpiler.transpile_utils import column_header_to_transpiled_code

def get_transpiled_importer_params(importer_params_and_type_and_value: Dict[str, Tuple[UserDefinedImporterParamType, str]]) -> str:
    param_strings = []
    for param_name, (param_type, param_value) in importer_params_and_type_and_value.items():

        if param_type == 'str':
            param_strings.append(f'{param_name}={column_header_to_transpiled_code(param_value)}')
        elif param_type == 'int':
            param_strings.append(f'{param_name}={column_header_to_transpiled_code(int(param_value))}')
        elif param_type == 'float':
            param_strings.append(f'{param_name}={column_header_to_transpiled_code(float(param_value))}')
        else:
            param_strings.append(
                f'{param_name}={param_value}'
            )
    return ", ".join(param_strings)



class UserDefinedImportCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, importer: str, importer_params_and_type_and_value: Dict[str, Tuple[UserDefinedImporterParamType, str]]):
        super().__init__(prev_state, post_state)
        self.importer = importer
        self.importer_params_and_type_and_value = importer_params_and_type_and_value

        self.df_names = [df_name for index, df_name in enumerate(self.post_state.df_names) if index >= len(self.prev_state.df_names)]

    def get_display_name(self) -> str:
        return 'User Defined Import'
    
    def get_description_comment(self) -> str:
        return f"Imported {', '.join(self.df_names)} using {self.importer}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        # For each new dataframe, we get it's name
        new_df_names = self.post_state.df_names[len(self.prev_state.df_names):]
        df_name_string = ', '.join(new_df_names)
        code = f"{df_name_string} = {self.importer}({get_transpiled_importer_params(self.importer_params_and_type_and_value)})"
        return [code], []
    
    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        num_new_dfs = len(self.post_state.dfs) - len(self.prev_state.dfs)
        return [i for i in range(len(self.post_state.dfs) - num_new_dfs, len(self.post_state.dfs))]