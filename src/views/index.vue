<template>
  <div class="container">
    <!-- 头部 -->
    <div class="header">
      <div class="title">
        PDF + MP3 阅读工具
      </div>
      <div class="open">
        <div class="open-pdf">
          <a-button type="primary">
            <template #icon>
              <CloudOutlined />
            </template>
            打开文档
          </a-button>
          <a-input
            type="file"
            accept="application/pdf"
            v-model:value="inputFile"
            @change="show"
          />
        </div>
        <div
          v-if="fileName"
          class="open-audio"
        >
          <a-button type="primary">
            <template #icon>
              <CloudOutlined />
            </template>
            设置音频
          </a-button>
          <a-input
            type="file"
            accept="audio/mp3, audio/wav"
            v-model:value="inputAudio"
            @change="audioChange"
          />
        </div>
      </div>
      <div class="view_progress">
        <a-slider
          v-model:value="pageNumber"
          :max="maxPage"
          @afterChange="show()"
        />
      </div>
    </div>
    <div class="view">
      <!-- 左边视觉部分 -->
      <div class="vision">
        <a-skeleton v-if="rendering || !fileName" />
        <div
          v-else
          class="pdf"
        >
          <div class="scale-controller">
            <a-slider
              vertical
              :marks="marks"
              v-model:value="scale"
              :max="20"
              @afterChange="show()"
            />
          </div>
          <div class="pdf-view">
            <canvas id="pdf-canvas" />
          </div>
          <div class="pdf-controller">
            <div
              v-show="pageNumber > 1"
              class="pageUp page-controll-btn"
              @click="pageUp(show)"
            >
              Prev
            </div>
            <div
              v-show="pageNumber < maxPage"
              class="pageDown page-controll-btn"
              @click="pageDown(show)"
            >
              Next
            </div>
          </div>
        </div>
      </div>
      <!-- 右边部分 -->
      <div class="hearing">
        <div class="filel-list">
          <a-list
            size="large"
            bordered
            :data-source="Object.keys(fileList)"
          >
            <template #renderItem="{ item }">
              <a-list-item @click="changePdf(item)">
                {{ item }}
                <template #actions>
                  <a
                    @click="deleteFile(item, fileList)"
                  >删除</a>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </div>
        <div class="audio">
          <audio
            id="mp3"
            :src="audioFile"
            controls
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CloudOutlined } from '@ant-design/icons-vue';
import { useIndexDB, useShow, useController } from '/@/script';

export default {
	name: 'Index',
	components: { CloudOutlined },
	setup() {
		const {
			db,
			openDb,
			findAll,
			add,
			findOne,
			update,
			remove,
		} = useIndexDB();
		const {
			loading,
			pageNumber,
			pageDown,
			pageUp,
			marks,
			changePdf,
			pdfFile,
			audioFile,
			rendering,
			fileName,
			deleteFile,
			getList,
			fileList,
		} = useController(findAll, findOne, remove);
		const {
			inputFile,
			scale,
			maxPage,
			show,
			inputAudio,
			audioChange,
		} = useShow(
			rendering,
			findAll,
			add,
			update,
			pageNumber
		);

		return {
			loading,
			db,
			openDb,
			getList,
			fileList,
			inputFile,
			deleteFile,
			scale,
			maxPage,
			rendering,
			audioFile,
			inputAudio,
			show,
			audioChange,
			pageNumber,
			pageDown,
			pageUp,
			marks,
			changePdf,
			pdfFile,
			fileName,
		};
	},
	watch: {
		pdfFile(newVal) {
			if (newVal && !this.loading) this.show();
		},
	},
	async mounted() {
		this.db = await this.openDb();
		await this.getList();
	},
};
</script>

<style lang="scss" scoped>
$headerHeight: 10vh;
$viewHeight: 100 - $headerHeight;
$visionnWidth: 80vw;
$hearingWidth: 100 - $visionnWidth;
$pageControllLength: 60px;

.container {
	width: 100vw;
	height: 100vh;
	display: flex;
	flex-direction: column;

	.header {
		width: 100vw;
		height: $headerHeight;
		position: relative;
		background: #333;
		z-index: 1000;

		.title {
			font-size: 20px;
			font-weight: 600;
			color: white;
			padding: 15px;
			position: absolute;
			top: 0;
			left: 0;
		}

		.open {
			display: flex;
			flex-direction: row;
			justify-content: space-around;
			color: white;
			position: relative;

			.open-pdf {
				position: absolute;
				top: 5vh;
				right: 140px;
				margin-top: -19px;
			}
			.open-audio {
				position: absolute;
				top: 5vh;
				right: 15px;
				margin-top: -19px;
			}

			input {
				position: absolute;
				top: 0;
				left: 0;
				opacity: 0;
			}
		}

		.view_progress {
			width: $visionnWidth;
			height: 36px;
			padding: 15px;
			position: absolute;
			bottom: 10px;
			left: 0;
		}
	}
	.view {
		width: 100vw;
		height: $viewHeight;
		display: flex;
		flex-direction: row;

		.vision {
			width: $visionnWidth;
			height: $viewHeight;
			background-color: #faf9de;
			display: flex;
			justify-content: center;

			.pdf {
				display: flex;
				flex-direction: row;
				justify-content: center;

				.scale-controller {
					padding: 20vh 36px;
				}

				.pdf-view {
					max-width: 70vw;
					height: 90vh;
					overflow: scroll;
					margin-right: 15px;
				}
				::-webkit-scrollbar {
					display: none; /* Chrome Safari */
				}

				.pdf-controller {
					display: flex;
					flex-direction: column;
					justify-content: center;

					.page-controll-btn {
						width: $pageControllLength;
						height: $pageControllLength;
						line-height: $pageControllLength;
						margin: 10px 0;
						text-align: center;
						border-radius: 50%;
						color: white;
						background: rgba(33, 33, 33, 0.7);
					}
				}
			}
		}
		.hearing {
			width: $hearingWidth;
			height: $viewHeight;
			background-color: #fafafa;
			display: flex;
			flex-direction: column;
			justify-content: space-between;

			.audio {
				margin: 15px auto;
			}
		}
	}
}
</style>