import { connect } from 'react-redux';

import Chapter from '../components/reference/chapter';

const mapStateToProps = ( state, ownProps ) => {
	return {
		reference: state.reference,
		inSync: state.settings.inSync,
	}
};

const ChapterContainer = connect(
 	mapStateToProps
)( Chapter )

export default ChapterContainer;
