"""
Useful decorators for tests.
"""

import pytest
import pandas as pd

from mitosheet.saved_analyses.schema_utils import is_prev_version


pandas_pre_1_only = pytest.mark.skipif(
    pd.__version__.startswith('1.'), 
    reason='This test only runs on earlier versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_only = pytest.mark.skipif(
    pd.__version__.startswith('0.'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_2_only = pytest.mark.skipif(
    not is_prev_version(pd.__version__, '1.2.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_pre_1_2_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '1.2.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)
