const initialState = {
	word: '',
	lemma: '',
	morph: '',
	version: 'kjv',
	clusivity: 'exclusive',
	range: 'verse',
	strict: false,
};

const searchForm = ( state = initialState, action ) => {
	switch ( action.type ) {
		case 'UPDATE_SEARCH_FORM':
			const updatedSearchForm = { ...state };
			updatedSearchForm[ action.name ] = action.value.trimStart();
			return updatedSearchForm;

		case 'APPEND_TO_SEARCH_FORM':
			const appendedSearchForm = { ...state };
			appendedSearchForm[ action.name ] = ( appendedSearchForm[ action.name ] + ' ' + action.value ).trimStart();
			return appendedSearchForm;

		case 'CLEAR_SEARCH_FORM': 
			return { ...initialState };

		default:
			return state;
	}
}

export default searchForm;
