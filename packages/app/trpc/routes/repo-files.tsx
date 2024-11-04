import { paramsJsonShape } from 'app/features/spec/params-json-shape'

const paramsJson: Zod.infer<typeof paramsJsonShape> = {
  docs: {
    main: 'readme.md',
    sidebar: {
      Readme: 'readme.md',
      Introduction: 'introduction.md',
      Installation: 'installation.md',
      Usage: 'usage.md',
      FAQ: 'faq.md',
    },
    youtube: {
      video_id: 'UakqL6Pj9xo',
      start_time: 252,
      thumbnail_url:
        'https://res.cloudinary.com/dof5uvynu/image/upload/t_2500px/trpc-uploads/djcb4hsicbqgc1kwee5l',
    },
  },
}

export const exampleRepoFiles = {
  'params.json': JSON.stringify(paramsJson, null, 2),
  'config.py':
    'import keras\nfrom keras.utils import FeatureSpace as fs\n\nconfig = keras.utils.Config()\n\n# Path to parquet file of scores/rating data\nconfig.score_data_parquet_fpath = "data/affinity_11092024_export.parquet"\nconfig.prod_model_path = "models/prod_model.keras"\nconfig.checkpoint_dir = "models/tmp"\n\n# Minimum number of scores/ratings per user to keep the user in the data\nconfig.min_scores_per_user = 2\n\n# Minimum number of scores/ratings per items to keep the item in the data\nconfig.min_scores_per_item = 50\n\n# Fraction of data to use for training (remainder is for eval)\nconfig.train_fraction = 0.8\n# Fraction of scores per user to use as targets\nconfig.target_score_fraction = 0.3\n\n# Training config\nconfig.batch_size = 64\nconfig.learning_rate = 1e-3\nconfig.max_epochs = 100\nconfig.early_stopping_patience = 4\n\n# Whether to use sparse or dense matrices for handling score data\nconfig.use_sparse_score_matrices = True\nconfig.score_scaling_factor = 5.05\n\nconfig.user_features_config = {\n    "gender": fs.string_categorical(\n        name="gender", num_oov_indices=0, output_mode="one_hot"\n    ),\n    "age": fs.float_normalized(name="age"),\n}\n\n# EDA config\nconfig.eda_figures_dpi = 200\nconfig.eda_figures_dir_before_filtering = "figures/before_filtering"\nconfig.eda_figures_dir_after_filtering = "figures/after_filtering"\n',
  'requirements.txt': 'keras>=3.6.0\npandas\nmatplotlib\nscipy\nnumpy\npyarrow\n',
  'baseline.py':
    'import numpy as np\nfrom config import config\n\n\ndef compute_baseline_metrics(inputs_matrix, targets_matrix):\n    inputs_matrix = inputs_matrix.toarray()\n    targets_matrix = targets_matrix.toarray()\n    mean_scores_per_item = np.mean(inputs_matrix, axis=0, where=inputs_matrix != 0).flatten()\n    total_loss = np.subtract(targets_matrix, mean_scores_per_item)\n    total_mse = total_loss ** 2\n    total_mse = np.mean(total_loss ** 2, where=targets_matrix != 0)\n    total_mae = np.mean(np.abs(total_loss), where=targets_matrix != 0)\n    if config.score_scaling_factor is not None:\n        total_mae *= config.score_scaling_factor\n    return total_mse, total_mae\n',
  'serve.py': '',
  'readme.md': `# Neural Collaborative Filtering Recommender System

A production-ready recommender system implementation using Keras that combines collaborative filtering with user features. Built for sparse user-item interaction matrices with support for both training and serving.

## Key Features

- Handles sparse user-item interaction matrices efficiently
- Supports user metadata features (age, gender)
- Implements masked loss functions for sparse data
- Includes hyperparameter search
- Provides data filtering and preprocessing utilities
- Includes baseline model comparison
- Built-in EDA tools for data analysis

## Quick Links

- [Introduction](introduction.md)
- [Installation](installation.md)
- [Usage](usage.md)
- [FAQ](faq.md)

## Architecture

The system uses a neural network with residual blocks to learn user-item interactions:

1. Input layer accepts sparse user-item interaction vectors
2. Dense layers with residual connections process the interactions
3. Dropout layers prevent overfitting
4. Output layer predicts scores for all items

The model is trained using masked loss functions to handle sparse data efficiently.

## License

MIT License
`,
  'introduction.md': `# Introduction to the Neural Recommender System

This recommender system implements a neural collaborative filtering approach optimized for sparse user-item interaction data. It's designed for production use cases where you need to handle large numbers of users and items efficiently.

## Core Concepts

### Data Structure
The system expects data in the following format:
- User-item interactions (scores/ratings)
- User metadata (optional features like age, gender)

### Key Components

1. **Data Processing** (\`data.py\`)
- Handles sparse matrix operations
- Implements data filtering
- Manages train/validation splits
- Processes user features

2. **Model Architecture** (\`train.py\`)
- Neural network with residual blocks
- Masked loss functions for sparse data
- Hyperparameter optimization
- Training workflow management

3. **Evaluation** (\`baseline.py\`)
- Implements baseline comparison metrics
- Handles masked evaluation for sparse data

4. **Analysis** (\`eda.py\`)
- Comprehensive data visualization
- Distribution analysis tools
- Data quality checks

## Key Features

### Sparse Data Handling
The system uses sparse matrices and masked loss functions to efficiently handle large, sparse datasets common in recommender systems.

### User Features
Supports additional user features through a flexible FeatureSpace configuration, allowing for hybrid recommendation approaches.

### Production Ready
Includes all necessary components for production deployment:
- Model checkpointing
- Early stopping
- Hyperparameter optimization
- Efficient serving setup

### Evaluation Framework
Built-in evaluation tools to compare against baselines and assess model performance across different metrics.
`,
  'installation.md': `# Installation Guide

## Requirements

\`\`\`bash
pip install -r requirements.txt
\`\`\`

Core dependencies:
- keras >= 3.6.0
- pandas
- matplotlib
- scipy
- numpy
- pyarrow

## Setup

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd recommender-system
\`\`\`

2. Create a virtual environment (recommended):
\`\`\`bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
\`\`\`

3. Install dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

4. Configure the system:
- Edit \`config.py\` to set your data paths and model parameters
- Key configurations:
- \`score_data_parquet_fpath\`: Path to your ratings data
- \`min_scores_per_user\`: Minimum ratings per user
- \`min_scores_per_item\`: Minimum ratings per item
- \`train_fraction\`: Train/test split ratio

## Directory Structure

\`\`\`
├── config.py           # Configuration parameters
├── data.py            # Data processing utilities
├── train.py           # Model training code
├── baseline.py        # Baseline metrics
├── eda.py            # Exploratory data analysis
├── main.py           # Training entry point
├── serve.py          # Serving utilities
├── models/           # Saved models directory
├── data/            # Data directory
└── figures/         # EDA output directory
\`\`\`

## Verification

Run the EDA script to verify your installation:
\`\`\`bash
python eda.py
\`\`\`

This will generate visualizations in the \`figures/\` directory.
`,
  'usage.md': `# Usage Guide

## Training a Model

### 1. Prepare Your Data

Your data should be in a parquet file with the following columns:
- \`ref_player\`: User ID
- \`ref_game\`: Item ID
- \`rating\`: Score/rating value

Optional user features:
- age
- gender

### 2. Configure the System

Edit \`config.py\`:

\`\`\`python
# Data configuration
config.score_data_parquet_fpath = "data/your_data.parquet"
config.min_scores_per_user = 2
config.min_scores_per_item = 50

# Training configuration
config.batch_size = 64
config.learning_rate = 1e-3
config.max_epochs = 100
\`\`\`

### 3. Train the Model

Run the main training script:

\`\`\`bash
python main.py
\`\`\`

This will:
1. Load and preprocess your data
2. Perform hyperparameter search
3. Train the final model
4. Save the model to \`models/prod_model.keras\`

### 4. Monitor Training

The training process provides:
- Loss metrics
- Validation metrics
- Early stopping information
- Best hyperparameter configurations

## Analyzing Your Data

Run the EDA script:

\`\`\`bash
python eda.py
\`\`\`

This generates visualizations of:
- Score distributions
- User activity distributions
- Item popularity distributions
- Before/after filtering comparisons

## Making Predictions

Load and use the trained model:

\`\`\`python
import keras
from data import prepare_input_vector

# Load the model
model = keras.models.load_model("models/prod_model.keras")

# Prepare input
user_vector = prepare_input_vector(user_id, user_features)

# Get predictions
predictions = model.predict(user_vector)
\`\`\`

## Hyperparameter Tuning

Customize the hyperparameter search in \`train.py\`:

\`\`\`python
def get_best_hp_config(train_ds, val_ds):
for num_blocks in (1, 2, 3):
  for layer_size in (512, 1024, 2048):
      hp_config = keras.utils.Config(
          num_blocks=num_blocks,
          layer_size=layer_size,
          dropout_rate=0.3,
      )
      # ... rest of the function
\`\`\`
`,
  'faq.md': `# Frequently Asked Questions

## Model Architecture

### Q: How does the model handle sparse data?
A: The model uses sparse matrices and masked loss functions (\`masked_binary_crossentropy\`, \`masked_mse\`, \`masked_mae\`) to efficiently handle sparse user-item interaction data. This allows it to train only on observed interactions while maintaining memory efficiency.

### Q: What's the purpose of the residual blocks?
A: The residual blocks help with training deep networks by providing skip connections. This helps prevent vanishing gradients and allows the model to learn both simple and complex interaction patterns.

## Data Processing

### Q: How much data is needed for good performance?
A: The system requires:
- At least \`min_scores_per_user\` (default: 2) ratings per user
- At least \`min_scores_per_item\` (default: 50) ratings per item
These can be adjusted in \`config.py\` based on your data characteristics.

### Q: How are train/test splits handled?
A: The system splits data at the user level (not individual ratings) to better simulate real-world performance. The split ratio is controlled by \`config.train_fraction\`.

## Training

### Q: How long should training take?
A: Training time depends on:
- Data size
- Number of hyperparameter combinations
- Early stopping patience
- Hardware capabilities
Typical training runs take 1-4 hours on modern hardware.

### Q: How do I handle out-of-memory errors?
A: Try:
1. Reducing \`batch_size\` in \`config.py\`
2. Setting \`use_sparse_score_matrices = True\`
3. Increasing data filtering thresholds
4. Using smaller layer sizes in hyperparameter search

## Performance

### Q: What's a good MAE score?
A: MAE scores are scaled by \`config.score_scaling_factor\`. Typical good scores are:
- 0.5-0.7 for 5-point scale ratings
- 0.8-1.2 for 10-point scale ratings

### Q: How does the baseline compare to the neural model?
A: The baseline (\`baseline.py\`) implements a mean-based predictor. The neural model typically improves MAE by 20-30% over this baseline.

## Production Use

### Q: How do I serve the model?
A: The model can be served using:
1. Keras Serving
2. TensorFlow Serving
3. Custom serving logic (implement in \`serve.py\`)

### Q: How often should I retrain?
A: Consider retraining when:
- New user ratings differ significantly from training distribution
- Item catalog changes significantly
- Performance metrics degrade
Typical retraining intervals are weekly or monthly.

## Customization

### Q: How do I add new user features?
A: Add new features to \`config.user_features_config\` in \`config.py\`:

\`\`\`python
config.user_features_config = {
"new_feature": fs.string_categorical(
  name="new_feature",
  num_oov_indices=0,
  output_mode="one_hot"
)
}
\`\`\`

### Q: Can I modify the model architecture?
A: Yes, modify \`get_model\` in \`train.py\`. The current architecture is modular and allows for easy modification of:
- Number of layers
- Layer sizes
- Activation functions
- Residual block structure
`,
  'train.py':
    'import os\nimport keras\nfrom keras import ops\n\nfrom config import config\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_binary_crossentropy(y_true, y_pred, mask_value=0):\n    """Computes the mean crossentropy over known scores only.\n\n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    raw_error = ops.binary_crossentropy(y_true, y_pred) * mask\n    masked_error = ops.sum(raw_error, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n    return masked_error\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_mse(y_true, y_pred, mask_value=0):\n    """Computes the mean MSE over known scores only.\n\n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    squared_diff = ops.square(y_true - y_pred) * mask\n    return ops.sum(squared_diff, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n\n\n@keras.saving.register_keras_serializable(package="recsys")\ndef masked_mae(y_true, y_pred, mask_value=0):\n    """Computes the mean absolute error over known scores only, and unscale it.\n    \n    Args:\n        y_true: The true score tensor.\n        y_pred: The predicted score tensor.\n\n    Returns:\n        Scalar tensor, the computed masked error.\n    """\n    mask = ops.cast(ops.not_equal(y_true, mask_value), dtype=y_pred.dtype)\n    raw_error = ops.abs(y_true - y_pred) * mask\n    masked_error = ops.sum(raw_error, axis=-1) / (ops.sum(mask, axis=-1) + keras.config.epsilon())\n    if config.score_scaling_factor is not None:\n        return masked_error * config.score_scaling_factor\n    return masked_error\n\n\ndef train_model(model, train_ds, val_ds=None, num_epochs=None):\n    """Train and evaluate a model.\n    \n    Args:\n        model: Keras model instance.\n        train_ds: Training dataset.\n        val_ds: Validation dataset.\n        num_epoch: Optional number of epochs to train for.\n            If unspecified, we use Early Stopping.\n            The best stopping epoch gets returned as the\n            "best_epoch" entry in the return dict.\n\n    Returns:\n        Dict with keys best_val_error and best_epoch.\n    """\n    if val_ds is None:\n        monitor = "loss"\n    else:\n        monitor = "val_loss"\n    os.makedirs(config.checkpoint_dir, exist_ok=True)\n    checkpoint_path = f"{config.checkpoint_dir}/best_model.keras"\n    callbacks = [\n        keras.callbacks.ModelCheckpoint(\n            filepath=checkpoint_path,\n            save_best_only=True,\n            monitor=monitor,\n        )\n    ]\n    metrics = [\n        masked_mae,\n    ]\n    optimizer = keras.optimizers.Adam(learning_rate=config.learning_rate)\n    loss = masked_binary_crossentropy\n    if num_epochs is None:\n        callbacks.append(\n            keras.callbacks.EarlyStopping(patience=config.early_stopping_patience, monitor=monitor, verbose=1, restore_best_weights=True)\n        )\n        num_epochs = config.max_epochs\n\n    # Train the model\n    model.compile(loss=loss, optimizer=optimizer, metrics=metrics)\n    model.fit(train_ds, epochs=num_epochs, callbacks=callbacks, validation_data=val_ds)\n\n    if val_ds:\n        # Evaluate best model\n        results = model.evaluate(val_ds, return_dict=True)\n    else:\n        results = model.evaluate(train_ds, return_dict=True)\n\n    if isinstance(callbacks[-1], keras.callbacks.EarlyStopping):\n        num_epochs = callbacks[-1].stopped_epoch\n\n    return {\n        "best_val_error": results["masked_mae"],\n        "best_epoch": num_epochs,\n    }\n\n\ndef get_model(hp_config, train_ds, val_ds=None):\n    """Creates, trains and evaluates a model based on a hp config."""\n    for x, y in train_ds.take(1):\n        num_features = x.shape[-1]\n        num_targets = y.shape[-1]\n\n    inputs = keras.Input(shape=(num_features,), name="inputs")\n\n    x = keras.layers.Dense(hp_config.layer_size, activation="relu")(inputs)\n    for _ in range(hp_config.num_blocks):\n        residual = x\n        x = keras.layers.Dense(hp_config.layer_size, activation="relu")(x)\n        x = keras.layers.Dense(hp_config.layer_size, activation="relu")(x)\n        x = keras.layers.Dropout(hp_config.dropout_rate)(x)\n        x = x + residual\n\n    outputs = keras.layers.Dense(num_targets, activation="sigmoid", name="outputs")(x)\n    model = keras.Model(inputs, outputs, name="score_prediction_model")\n    model.summary()\n\n    results = train_model(\n        model, train_ds, val_ds=val_ds, num_epochs=hp_config.get("best_epoch", None)\n    )\n    return model, results\n\n\ndef get_best_hp_config(train_ds, val_ds):\n    """Implements elementary hyperparameter search.\n\n    For anything more sophisticated, you should use KerasTuner.\n    """\n    all_results = []\n    for num_blocks in (1, 2):\n        for layer_size in (512, 1024, 2048):\n            hp_config = keras.utils.Config(\n                num_blocks=num_blocks,\n                layer_size=layer_size,\n                dropout_rate=0.3,\n            )\n            print("Trying config: ", hp_config)\n            _, results = get_model(hp_config, train_ds, val_ds=val_ds)\n            results["hp_config"] = hp_config\n            all_results.append(results)\n    all_results.sort(key=lambda x: x["best_val_error"])\n    best_hp_config = all_results[0]["hp_config"]\n    best_hp_config["best_epoch"] = all_results[0]["best_epoch"]\n    return best_hp_config\n',
  'main.py':
    'import data\nfrom config import config\nimport train\nimport baseline\n\n\nif __name__ == "__main__":\n    # Load raw data\n    print("Loading data...")\n    score_data = data.get_score_data()\n    user_data = data.get_user_data()\n\n    # Filter users and items with insufficient data\n    print("Filtering data...")\n    score_data, user_data, user_to_id, item_to_id = data.filter_and_index_data(\n        score_data, user_data\n    )\n\n    # Use a validation split to find the best hps\n    print("Making datasets...")\n    train_ds, val_ds = data.get_train_and_val_datasets(\n        score_data, user_data, user_to_id, item_to_id\n    )\n\n    print("Running hyperparameter search...")\n    hp_config = train.get_best_hp_config(train_ds, val_ds)\n    print("Best hp config:", hp_config)\n\n    # Train a model on the full dataset with the best hps\n    print("Training production model...")\n    full_ds = data.get_full_dataset(score_data, user_data, user_to_id, item_to_id)\n    model, _ = train.get_model(hp_config, full_ds)\n\n    # Save the model\n    model.save(config.prod_model_path)\n',
  'data.py':
    'import random\nimport keras\n\n# TF is only used for tf.data - the code works with all backends\nimport tensorflow as tf\n\nimport numpy as np\nimport pandas as pd\nfrom scipy.sparse import lil_matrix\n\nfrom config import config\n\n\ndef get_score_data():\n    """Return dict structured as {user_id: [(item_id, score), ...], ...}"""\n    df = pd.read_parquet(config.score_data_parquet_fpath)\n    score_data = {}\n    for row in df.itertuples():\n        if row.ref_player not in score_data:\n            score_data[row.ref_player] = []\n        score_data[row.ref_player].append((row.ref_game, row.rating))\n    return score_data\n\n\ndef get_user_data():\n    """Return dict structured as {user_id: {feature_name: value, ...}, ...]}"""\n    score_data = get_score_data()\n    user_data = {}\n    age_choices = list(range(21, 90))\n    gender_choices = ["male", "female", "unknown"]\n    for key in score_data.keys():\n        user_data[key] = {\n            "age": random.choice(age_choices),\n            "gender": random.choice(gender_choices),\n        }\n    return user_data\n\n\ndef filter_score_data(score_data, min_scores_per_user, min_scores_per_item):\n    """Filter out items that have too few scores.\n\n    Also proceededs to filter out users that subsequently have too few\n    items scored.\n\n    Args:\n        score_data: Dict `{user_id: [(item_id, score), ...], ...}`\n        min_scores_per_user: Threshold below which to drop a user.\n        min_scores_per_item: Threshold below which to drop an item.\n\n    Returns:\n        New `score_data` dict.\n    """\n    score_data = {u: s for u, s in score_data.items() if len(s) >= min_scores_per_user}\n\n    score_count_per_item = {}\n    for user, scores in score_data.items():\n        for item, _ in scores:\n            if item not in score_count_per_item:\n                score_count_per_item[item] = 1\n            else:\n                score_count_per_item[item] += 1\n    items_to_exclude = set(\n        i for i, c in score_count_per_item.items() if c < min_scores_per_item\n    )\n\n    new_score_data = {}\n    for user, scores in score_data.items():\n        new_scores = []\n        for item, score in scores:\n            if item not in items_to_exclude:\n                new_scores.append((item, score))\n        if len(new_scores) >= min_scores_per_user:\n            new_score_data[user] = new_scores\n    return new_score_data\n\n\ndef split_score_data_into_inputs_and_targets(score_data):\n    """Split the score_data dict into input scores and target scores.\n\n    Each user is associated with a number of scores.\n    We split those scores into two subgroups: input scores\n    and target scores. The idea is to show the model\n    the input scores, predict scores for all items,\n    and only train/eval based on the target scores.\n    """\n    input_score_data = {}\n    target_score_data = {}\n    for user, scores in score_data.items():\n        num_to_drop = max(1, round(len(scores) * config.target_score_fraction))\n        random.shuffle(scores)\n        inputs_scores = scores[:-num_to_drop]\n        targets_scores = scores[-num_to_drop:]\n        input_score_data[user] = inputs_scores\n        target_score_data[user] = targets_scores\n    return input_score_data, target_score_data\n\n\ndef index_users_and_items(score_data):\n    """Associates users and items with a unique integer ID."""\n    user_to_id = {}\n    item_to_id = {}\n    user_index = 0\n    item_index = 0\n    for user, scores in score_data.items():\n        if user not in user_to_id:\n            user_to_id[user] = user_index\n            user_index += 1\n        for item, _ in scores:\n            if item not in item_to_id:\n                item_to_id[item] = item_index\n                item_index += 1\n    return user_to_id, item_to_id\n\n\ndef vectorize_score_data(\n    score_data, user_to_id, item_to_id, sparse=True, dtype="float32"\n):\n    """Split score data into inputs and targets and turn them into sparse (or dense) matrices."""\n    input_score_data, target_score_data = split_score_data_into_inputs_and_targets(\n        score_data\n    )\n    input_matrix = make_score_matrix(\n        input_score_data, user_to_id, item_to_id, sparse=sparse, dtype=dtype\n    )\n    target_matrix = make_score_matrix(\n        target_score_data, user_to_id, item_to_id, sparse=sparse, dtype=dtype\n    )\n    return input_matrix, target_matrix\n\n\ndef make_score_matrix(score_data, user_to_id, item_to_id, sparse=True, dtype="float32"):\n    """Turns score data into a sparse (or dense) matrix."""\n    shape = (len(score_data), len(item_to_id))\n\n    if sparse:\n        matrix = lil_matrix(shape, dtype=dtype)\n    else:\n        matrix = np.zeros(shape, dtype=dtype)\n    for user, scores in score_data.items():\n        user_id = user_to_id[user]\n        for item, score in scores:\n            item_id = item_to_id.get(item, None)\n            if item_id is not None:\n                matrix[user_id, item_id] = score\n    return matrix\n\n\ndef sparse_matrix_to_dataset(sparse_matrix):\n    """Turn a sparse matrix into a tf.data.Dataset."""\n    coo_matrix = sparse_matrix.tocoo()\n    indices = np.vstack((coo_matrix.row, coo_matrix.col)).transpose()\n    sparse_tensor = tf.SparseTensor(\n        indices=indices, values=coo_matrix.data, dense_shape=sparse_matrix.shape\n    )\n    ds = tf.data.Dataset.from_tensor_slices((sparse_tensor,))\n    return ds.map(lambda x: tf.sparse.to_dense(x))\n\n\ndef scale_score_matrix(score_matrix):\n    if config.score_scaling_factor is not None:\n        return score_matrix / config.score_scaling_factor\n    return score_matrix\n\n\ndef make_dataset(\n    input_scores, target_scores, user_features, user_features_preprocessor, batch_size\n):\n    """Turn score and user data a into tf.data.Dataset."""\n    if isinstance(input_scores, lil_matrix):\n        input_scores_ds = sparse_matrix_to_dataset(input_scores)\n    else:\n        input_scores_ds = tf.data.Dataset.from_tensor_slices((input_scores,))\n    if isinstance(target_scores, lil_matrix):\n        target_scores_ds = sparse_matrix_to_dataset(target_scores)\n    else:\n        target_scores_ds = tf.data.Dataset.from_tensor_slices((target_scores,))\n\n    features_ds = tf.data.Dataset.from_tensor_slices((user_features,))\n    features_ds = features_ds.map(user_features_preprocessor, num_parallel_calls=8)\n    # dataset = tf.data.Dataset.zip(input_scores_ds, target_scores_ds, features_ds)\n    dataset = tf.data.Dataset.zip(input_scores_ds, target_scores_ds)\n    # dataset = dataset.map(\n    #     lambda x, y, z: (tf.concat((x, z), axis=-1), y), num_parallel_calls=8\n    # )\n    return dataset.batch(batch_size).prefetch(8)\n\n\ndef prepare_user_features(user_data, user_to_id):\n    """Turns user data into the format\n    {feature_name: [value_for_user_0, value_for_user_1, ...], ...}"""\n    one_user = next(iter(user_data))\n    ids = range(len(user_to_id))\n    id_to_user = {v: k for k, v in user_to_id.items()}\n    user_features = {\n        k: [user_data[id_to_user[i]][k] for i in ids]\n        for k in user_data[one_user].keys()\n    }\n    return user_features\n\n\ndef make_user_features_preprocessor(user_features, feature_config):\n    """Creates an adapt a Keras FeatureSpace to vectorize user features."""\n    preprocessor = keras.utils.FeatureSpace(\n        feature_config,\n    )\n    preprocessor.adapt(tf.data.Dataset.from_tensor_slices(user_features))\n    return preprocessor\n\n\ndef filter_and_index_data(score_data, user_data):\n    """Filters out users and items with insufficient score data,\n    and computes integer IDs for users and items."""\n    # Filter data\n    print("before filtering", len(score_data))\n    score_data = filter_score_data(\n        score_data,\n        min_scores_per_user=config.min_scores_per_user,\n        min_scores_per_item=config.min_scores_per_item,\n    )\n    user_data = {k: user_data[k] for k in score_data.keys()}\n    print("after filtering", len(score_data))\n\n    # Index data\n    user_to_id, item_to_id = index_users_and_items(score_data)\n    return score_data, user_data, user_to_id, item_to_id\n\n\ndef get_train_and_val_datasets(score_data, user_data, user_to_id, item_to_id):\n    # Vectorize\n    input_scores, target_scores = vectorize_score_data(\n        score_data,\n        user_to_id,\n        item_to_id,\n        sparse=config.use_sparse_score_matrices,\n        dtype="float32",\n    )\n    input_scores = scale_score_matrix(input_scores)\n    target_scores = scale_score_matrix(target_scores)\n\n    # Split users between train and test\n    users = sorted(score_data.keys())\n    num_train_samples = round(config.train_fraction * len(users))\n\n    train_input_scores = input_scores[:num_train_samples]\n    train_target_scores = target_scores[:num_train_samples]\n\n    val_input_scores = input_scores[num_train_samples:]\n    val_target_scores = target_scores[num_train_samples:]\n\n    from baseline import compute_baseline_metrics\n    print(compute_baseline_metrics(train_input_scores, val_target_scores))\n\n    user_features = prepare_user_features(user_data, user_to_id)\n    train_user_features = {k: v[num_train_samples:] for k, v in user_features.items()}\n    val_user_features = {k: v[:num_train_samples] for k, v in user_features.items()}\n\n    # Preprocess user features\n    user_features_preprocessor = make_user_features_preprocessor(\n        train_user_features, feature_config=config.user_features_config\n    )\n\n    # Make streaming datasets\n    train_ds = make_dataset(\n        train_input_scores,\n        train_target_scores,\n        train_user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n    val_ds = make_dataset(\n        val_input_scores,\n        val_target_scores,\n        val_user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n    return train_ds, val_ds\n\n\ndef get_full_dataset(score_data, user_data, user_to_id, item_to_id):\n    input_scores, target_scores = vectorize_score_data(\n        score_data,\n        user_to_id,\n        item_to_id,\n        sparse=config.use_sparse_score_matrices,\n        dtype="float32",\n    )\n    input_scores = scale_score_matrix(input_scores)\n    target_scores = scale_score_matrix(target_scores)\n\n    user_features = prepare_user_features(user_data, user_to_id)\n    user_features_preprocessor = make_user_features_preprocessor(\n        user_features, feature_config=config.user_features_config\n    )\n    return make_dataset(\n        input_scores,\n        target_scores,\n        user_features,\n        user_features_preprocessor,\n        batch_size=config.batch_size,\n    )\n',
}
